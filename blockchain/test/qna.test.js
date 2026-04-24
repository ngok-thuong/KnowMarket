const { expect } = require("chai");
const hre = require("hardhat");

const USDC = (n) => BigInt(Math.round(n * 1_000_000));

describe("QnA", function () {
  async function deploy() {
    const [owner, asker, alice, bob, carol, voter1, voter2, voter3, treasury] =
      await hre.ethers.getSigners();

    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const feeBps = 200; // 2%
    const minFee = USDC(0.2); // 0.2 USDC
    const maxFee = USDC(10); // 10 USDC
    const minBounty = USDC(2); // 2 USDC

    const QnA = await hre.ethers.getContractFactory("QnA");
    const qna = await QnA.deploy(await usdc.getAddress(), treasury.address, feeBps, minFee, maxFee, minBounty);
    await qna.waitForDeployment();

    // Fund asker
    await usdc.mint(asker.address, USDC(1_000));

    return { owner, asker, alice, bob, carol, voter1, voter2, voter3, treasury, usdc, qna, feeBps, minFee, maxFee, minBounty };
  }

  // Helper: create a question with a short or long deadline
  async function createQ(qna, usdc, asker, bounty, deadlineSec = 3600) {
    const fee = await qna.quoteFee(bounty);
    const now = BigInt((await hre.ethers.provider.getBlock("latest")).timestamp);
    const deadline = now + BigInt(deadlineSec);
    await usdc.connect(asker).approve(await qna.getAddress(), bounty + fee);
    await qna.connect(asker).createQuestion("ipfs://q1", bounty, Number(deadline));
    return { fee, deadline };
  }

  // Helper: advance EVM time past deadline
  async function passDeadline() {
    await hre.network.provider.send("evm_increaseTime", [20]);
    await hre.network.provider.send("evm_mine");
  }

  it("quotes fee with clamp", async function () {
    const { qna } = await deploy();

    // 2% of 2 USDC = 0.04 USDC -> clamped to minFee 0.2
    expect(await qna.quoteFee(USDC(2))).to.equal(USDC(0.2));

    // 2% of 1000 USDC = 20 USDC -> clamped to maxFee 10
    expect(await qna.quoteFee(USDC(1000))).to.equal(USDC(10));
  });

  it("createQuestion transfers fee to treasury and escrows bounty", async function () {
    const { qna, usdc, asker, treasury } = await deploy();

    const bounty = USDC(5);
    const fee = await qna.quoteFee(bounty);
    const deadline = BigInt((await hre.ethers.provider.getBlock("latest")).timestamp) + 3600n;

    await usdc.connect(asker).approve(await qna.getAddress(), bounty + fee);

    await expect(qna.connect(asker).createQuestion("ipfs://q1", bounty, Number(deadline)))
      .to.emit(qna, "QuestionCreated")
      .withArgs(1n, asker.address, await usdc.getAddress(), bounty, "ipfs://q1", Number(deadline));

    expect(await usdc.balanceOf(treasury.address)).to.equal(fee);
    expect(await usdc.balanceOf(await qna.getAddress())).to.equal(bounty);
  });

  it("prevents double-vote per wallet per question", async function () {
    const { qna, usdc, asker, alice, voter1, treasury } = await deploy();

    const bounty = USDC(5);
    const fee = await qna.quoteFee(bounty);
    const deadline = BigInt((await hre.ethers.provider.getBlock("latest")).timestamp) + 3600n;
    await usdc.connect(asker).approve(await qna.getAddress(), bounty + fee);
    await qna.connect(asker).createQuestion("ipfs://q1", bounty, Number(deadline));

    await qna.connect(alice).submitAnswer(1n, "ipfs://a1");

    await expect(qna.connect(voter1).vote(1n, 1n)).to.emit(qna, "VoteCast");
    await expect(qna.connect(voter1).vote(1n, 1n)).to.be.revertedWithCustomError(qna, "AlreadyVoted");
  });

  it("refunds asker (pull) if no answers after deadline", async function () {
    const { qna, usdc, asker, treasury } = await deploy();

    const bounty = USDC(5);
    const fee = await qna.quoteFee(bounty);
    const now = BigInt((await hre.ethers.provider.getBlock("latest")).timestamp);
    const deadline = now + 10n;
    await usdc.connect(asker).approve(await qna.getAddress(), bounty + fee);
    await qna.connect(asker).createQuestion("ipfs://q1", bounty, Number(deadline));

    // Move time forward past deadline
    await hre.network.provider.send("evm_increaseTime", [20]);
    await hre.network.provider.send("evm_mine");

    await expect(qna.resolve(1n))
      .to.emit(qna, "QuestionResolved")
      .withArgs(1n, 0n, hre.ethers.ZeroAddress, await usdc.getAddress(), 0n, 1);

    const balBefore = await usdc.balanceOf(asker.address);
    await qna.connect(asker).withdrawRefund(1n);
    const balAfter = await usdc.balanceOf(asker.address);
    expect(balAfter - balBefore).to.equal(bounty);

    // bounty left contract
    expect(await usdc.balanceOf(await qna.getAddress())).to.equal(0n);
    // fee still at treasury
    expect(await usdc.balanceOf(treasury.address)).to.equal(fee);
  });

  it("winner can claim bounty (pull) after resolve; tie-break earliest answerId when votes equal", async function () {
    const { qna, usdc, asker, alice, bob, voter1, voter2 } = await deploy();

    const bounty = USDC(5);
    const fee = await qna.quoteFee(bounty);
    const now = BigInt((await hre.ethers.provider.getBlock("latest")).timestamp);
    const deadline = now + 10n;
    await usdc.connect(asker).approve(await qna.getAddress(), bounty + fee);
    await qna.connect(asker).createQuestion("ipfs://q1", bounty, Number(deadline));

    // two answers
    await qna.connect(alice).submitAnswer(1n, "ipfs://a1"); // answerId=1
    await qna.connect(bob).submitAnswer(1n, "ipfs://a2"); // answerId=2

    // equal votes -> tie-break to smaller answerId (1)
    await qna.connect(voter1).vote(1n, 1n);
    await qna.connect(voter2).vote(1n, 2n);

    await hre.network.provider.send("evm_increaseTime", [20]);
    await hre.network.provider.send("evm_mine");

    await expect(qna.resolve(1n)).to.emit(qna, "QuestionResolved").withArgs(
      1n,
      1n,
      alice.address,
      await usdc.getAddress(),
      bounty,
      0
    );

    const balBefore = await usdc.balanceOf(alice.address);
    await qna.connect(alice).claimReward(1n);
    const balAfter = await usdc.balanceOf(alice.address);
    expect(balAfter - balBefore).to.equal(bounty);
  });

  // ─── createQuestion guards ───────────────────────────────────────────────

  it("createQuestion: reverts when paused", async function () {
    const { qna, usdc, asker, owner } = await deploy();
    await qna.connect(owner).setPaused(true);
    const bounty = USDC(5);
    const fee = await qna.quoteFee(bounty);
    const now = BigInt((await hre.ethers.provider.getBlock("latest")).timestamp);
    await usdc.connect(asker).approve(await qna.getAddress(), bounty + fee);
    await expect(
      qna.connect(asker).createQuestion("ipfs://q1", bounty, Number(now + 3600n))
    ).to.be.revertedWithCustomError(qna, "Paused");
  });

  it("createQuestion: reverts if bounty below minimum", async function () {
    const { qna, usdc, asker } = await deploy();
    const bounty = USDC(1); // below minBounty=2
    const fee = await qna.quoteFee(bounty);
    const now = BigInt((await hre.ethers.provider.getBlock("latest")).timestamp);
    await usdc.connect(asker).approve(await qna.getAddress(), bounty + fee);
    await expect(
      qna.connect(asker).createQuestion("ipfs://q1", bounty, Number(now + 3600n))
    ).to.be.revertedWithCustomError(qna, "InvalidParams");
  });

  // ─── submitAnswer guards ─────────────────────────────────────────────────

  it("submitAnswer: prevents asker from answering own question", async function () {
    const { qna, usdc, asker } = await deploy();
    await createQ(qna, usdc, asker, USDC(5));
    await expect(
      qna.connect(asker).submitAnswer(1n, "ipfs://a1")
    ).to.be.revertedWithCustomError(qna, "Unauthorized");
  });

  it("submitAnswer: prevents same wallet submitting twice", async function () {
    const { qna, usdc, asker, alice } = await deploy();
    await createQ(qna, usdc, asker, USDC(5));
    await qna.connect(alice).submitAnswer(1n, "ipfs://a1");
    await expect(
      qna.connect(alice).submitAnswer(1n, "ipfs://a2")
    ).to.be.revertedWithCustomError(qna, "AlreadyAnswered");
  });

  it("submitAnswer: enforces maxAnswersPerQuestion cap", async function () {
    const { qna, usdc, asker, owner, alice, bob, carol } = await deploy();
    await qna.connect(owner).setMaxAnswersPerQuestion(2);
    await createQ(qna, usdc, asker, USDC(5));
    await qna.connect(alice).submitAnswer(1n, "ipfs://a1");
    await qna.connect(bob).submitAnswer(1n, "ipfs://a2");
    await expect(
      qna.connect(carol).submitAnswer(1n, "ipfs://a3")
    ).to.be.revertedWithCustomError(qna, "InvalidParams");
  });

  it("submitAnswer: reverts past deadline", async function () {
    const { qna, usdc, asker, alice } = await deploy();
    await createQ(qna, usdc, asker, USDC(5), 10);
    await passDeadline();
    await expect(
      qna.connect(alice).submitAnswer(1n, "ipfs://a1")
    ).to.be.revertedWithCustomError(qna, "PastDeadline");
  });

  // ─── resolve: NO_VOTES path (answers exist but 0 votes) ─────────────────

  it("resolve: NO_VOTES (answers but 0 votes) → RESOLUTION_NO_VOTES=2, asker refunded", async function () {
    const { qna, usdc, asker, alice, treasury } = await deploy();
    const bounty = USDC(5);
    const { fee } = await createQ(qna, usdc, asker, bounty, 10);
    await qna.connect(alice).submitAnswer(1n, "ipfs://a1"); // answer exists, no vote
    await passDeadline();

    await expect(qna.resolve(1n))
      .to.emit(qna, "QuestionResolved")
      .withArgs(1n, 0n, hre.ethers.ZeroAddress, await usdc.getAddress(), 0n, 2);

    const balBefore = await usdc.balanceOf(asker.address);
    await qna.connect(asker).withdrawRefund(1n);
    expect((await usdc.balanceOf(asker.address)) - balBefore).to.equal(bounty);
    expect(await usdc.balanceOf(await qna.getAddress())).to.equal(0n);
    expect(await usdc.balanceOf(treasury.address)).to.equal(fee);
  });

  it("resolve: NO_VOTES → answerer cannot claim reward", async function () {
    const { qna, usdc, asker, alice } = await deploy();
    await createQ(qna, usdc, asker, USDC(5), 10);
    await qna.connect(alice).submitAnswer(1n, "ipfs://a1");
    await passDeadline();
    await qna.resolve(1n);
    await expect(
      qna.connect(alice).claimReward(1n)
    ).to.be.revertedWithCustomError(qna, "NotClaimable");
  });

  // ─── resolve: decisive winner ────────────────────────────────────────────

  it("resolve: highest vote count wins decisively", async function () {
    const { qna, usdc, asker, alice, bob, voter1, voter2, voter3 } = await deploy();
    await createQ(qna, usdc, asker, USDC(5), 10);
    await qna.connect(alice).submitAnswer(1n, "ipfs://a1"); // answerId=1
    await qna.connect(bob).submitAnswer(1n, "ipfs://a2");   // answerId=2
    await qna.connect(voter1).vote(1n, 1n); // alice: 2 votes
    await qna.connect(voter2).vote(1n, 1n);
    await qna.connect(voter3).vote(1n, 2n); // bob: 1 vote
    await passDeadline();

    await expect(qna.resolve(1n))
      .to.emit(qna, "QuestionResolved")
      .withArgs(1n, 1n, alice.address, await usdc.getAddress(), USDC(5), 0);
  });

  it("resolve: cannot resolve the same question twice", async function () {
    const { qna, usdc, asker } = await deploy();
    await createQ(qna, usdc, asker, USDC(5), 10);
    await passDeadline();
    await qna.resolve(1n);
    await expect(qna.resolve(1n)).to.be.revertedWithCustomError(qna, "AlreadyResolved");
  });

  // ─── admin ───────────────────────────────────────────────────────────────

  it("setMaxAnswersPerQuestion: non-owner is rejected", async function () {
    const { qna, alice } = await deploy();
    await expect(
      qna.connect(alice).setMaxAnswersPerQuestion(10)
    ).to.be.revertedWithCustomError(qna, "Unauthorized");
  });

  it("setFeeParams: non-owner is rejected", async function () {
    const { qna, alice, minFee, maxFee, minBounty } = await deploy();
    await expect(
      qna.connect(alice).setFeeParams(300, minFee, maxFee, minBounty)
    ).to.be.revertedWithCustomError(qna, "Unauthorized");
  });

  it("transferOwnership: old owner loses access, new owner gains it", async function () {
    const { qna, owner, alice } = await deploy();
    await qna.connect(owner).transferOwnership(alice.address);
    await expect(
      qna.connect(owner).setPaused(true)
    ).to.be.revertedWithCustomError(qna, "Unauthorized");
    await expect(qna.connect(alice).setPaused(true)).to.not.be.reverted;
  });
});

