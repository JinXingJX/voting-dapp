import {
  ActionGetResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import { Voting } from "@/../anchor/target/types/voting";

const IDL = require("@/../anchor/target/idl/voting.json");

export const OPTIONS = GET;

export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon: "https://cdn.shopify.com/s/files/1/1029/7511/files/peanut_butter_01_1024x1024.png?v=1564364225",
    title: "Vote for your favorite type fo peanut butter",
    description: "Vote between crunchy and smooth type",
    label: "Vote",
    links: {
      actions: [
        {
          label: "Vote for Crunchy",
          href: "/api/vote?candidate=crunchy",
          type: "post",
        },
        {
          label: "Vote for Smooth",
          href: "/api/vote?candidate=smooth",
          type: "post",
        },
      ],
    },
  };
  // 添加缓存控制头
  const headers = {
    ...ACTIONS_CORS_HEADERS,
    "Cache-Control": "no-cache, no-store, must-revalidate",
  };
  return Response.json(actionMetadata, { headers: headers });
}

export async function POST(request: Request) {
  const url = new URL(request.url);

  const candidate = url.searchParams.get("candidate");
  if (candidate != "crunchy" && candidate != "smooth") {
    return new Response("Invalid candidate", {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const votingProgram: Program<Voting> = new Program(IDL, { connection });
  const body: ActionPostRequest = await request.json();
  let voter;

  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    return Response.json("Invalid account", {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
  const instruction = await votingProgram.methods
    .vote(candidate, new BN(1))
    .accounts({
      signer: voter,
    })
    .instruction();

  const blockhash = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  }).add(instruction);

  const response = await createPostResponse({
    fields: {
      transaction: transaction,
      type: "transaction",
    },
  });
  return Response.json(response, {
    headers: {
      ...ACTIONS_CORS_HEADERS,
      "Cache-Control": "no-store",
    },
  });
}
