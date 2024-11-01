import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Voting } from "../target/types/voting";
import { BankrunProvider, startAnchor } from "anchor-bankrun";

const IDL = require("../target/idl/voting.json");

const votingAddress = new PublicKey(
  "AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ",
);

describe("votingdapp", () => {
  let context;
  let provider;
  let votingProgram: Program<Voting>;

  beforeAll(async () => {
    context = await startAnchor(
      "",
      [{ name: "votingdapp", programId: votingAddress }],
      [],
    );
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(IDL, provider);
  });

  it("Initialize poll", async () => {
    await votingProgram.methods
      .initializePoll(
        new anchor.BN(1),
        "what is your favorite type of peanut butter?",
        new anchor.BN(0),
        new anchor.BN(1830271514),
      )
      .rpc();
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress,
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual(
      "what is your favorite type of peanut butter?",
    );
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });

  it("Initialize candidate", async () => {
    await votingProgram.methods
      .initializeCandidate("jin", new anchor.BN(1))
      .rpc();

    const jinCandidate = await getCandidate(new anchor.BN(1), "jin");

    console.log(jinCandidate);

    expect(jinCandidate.candidateName).toEqual("jin");
    expect(jinCandidate.candidateVotes.toNumber()).toEqual(0);

    await votingProgram.methods
      .initializeCandidate("xing", new anchor.BN(1))
      .rpc();

    const xingCandidate = await getCandidate(new anchor.BN(1), "xing");

    console.log(xingCandidate);

    expect(xingCandidate.candidateName).toEqual("xing");
    expect(xingCandidate.candidateVotes.toNumber()).toEqual(0);
  });

  it("vote", async () => {
    await votingProgram.methods.vote("xing", new anchor.BN(1)).rpc();
    const xingCandidate = await getCandidate(new anchor.BN(1), "xing");
    console.log(xingCandidate);
  });

  async function getCandidate(poll_id: anchor.BN, candidate_name: string) {
    const [candidateAddress] = PublicKey.findProgramAddressSync(
      [poll_id.toArrayLike(Buffer, "le", 8), Buffer.from(candidate_name)],
      votingAddress,
    );

    const candidate =
      await votingProgram.account.candidtate.fetch(candidateAddress);
    return candidate;
  }
});
