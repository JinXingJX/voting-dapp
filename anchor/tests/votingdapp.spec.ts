import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Voting } from "../target/types/voting";
import { BankrunProvider, startAnchor } from "anchor-bankrun";

const IDL = require("../target/idl/voting.json");

const votingAddress = new PublicKey(
  "2Lcon4GW5oDQrTMd4yEnuZoqfFET8FwGWTYM779iprwt",
);

describe("votingdapp", () => {
  let context;
  let provider;
  anchor.setProvider(anchor.AnchorProvider.env());
  let votingProgram = anchor.workspace.Voting as Program<Voting>;

  beforeAll(async () => {
    // context = await startAnchor(
    //   "",
    //   [{ name: "votingdapp", programId: votingAddress }],
    //   [],
    // );
    // provider = new BankrunProvider(context);
    // votingProgram = new Program<Voting>(IDL, provider);
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
      .initializeCandidate("crunchy", new anchor.BN(1))
      .rpc();

    const crunchyCandidate = await getCandidate(new anchor.BN(1), "crunchy");

    console.log(crunchyCandidate);

    expect(crunchyCandidate.candidateName).toEqual("crunchy");
    expect(crunchyCandidate.candidateVotes.toNumber()).toEqual(0);

    await votingProgram.methods
      .initializeCandidate("smooth", new anchor.BN(1))
      .rpc();

    const smoothCandidate = await getCandidate(new anchor.BN(1), "smooth");

    console.log(smoothCandidate);

    expect(smoothCandidate.candidateName).toEqual("smooth");
    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(0);
  });

  it("vote", async () => {
    await votingProgram.methods.vote("smooth", new anchor.BN(1)).rpc();
    const smoothCandidate = await getCandidate(new anchor.BN(1), "smooth");
    console.log(smoothCandidate);
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
