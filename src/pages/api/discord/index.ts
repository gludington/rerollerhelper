import { InteractionResponseType, InteractionType, verifyKey } from "discord-interactions";
import { NextApiRequest, NextApiResponse } from "next";
import getRawBody from "raw-body";
import { Readable } from "node:stream";
import { env } from "../../../env/server.mjs";

const INVITE_COMMAND = {
  name: "Invite",
  description: "Get an invite link to add the bot to your server",
};

const HI_COMMAND = {
  name: "Hi",
  description: "Say hello!",
};

const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${env["APPLICATION_ID"]}&scope=applications.commands`;

export const config = {
  api: {
    bodyParser: false,
  },
};

const discord = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method === "GET") {
    return response.status(405).send({ error: "Bad request method " });
  }
  // Only respond to POST requests
  if (request.method === "POST") {
    // Verify the request
    const signature = request.headers["x-signature-ed25519"];
    const timestamp = request.headers["x-signature-timestamp"];

    const rawBody = JSON.stringify(request.body);

    console.error(signature);
    console.error(typeof signature);
    console.error(timestamp);
    console.error(typeof timestamp);
    console.error(rawBody);
    console.error(env["PUBLIC_KEY"]);
    console.error(
      verifyKey(
        rawBody,
        typeof signature === "string" ? signature : "ddd",
        typeof timestamp === "string" ? timestamp : "ack",
        env["PUBLIC_KEY"],
      ),
    );
    const isValidRequest =
      typeof signature === "string" && typeof timestamp === "string" && verifyKey(rawBody, signature, timestamp, env["PUBLIC_KEY"]);

    if (!isValidRequest) {
      return response.status(401).send({ error: "Bad request signature " });
    }

    // Handle the request
    const message = request.body;

    // Handle PINGs from Discord
    if (message.type === InteractionType.PING) {
      console.log("Handling Ping request");
      response.send({
        type: InteractionResponseType.PONG,
      });
    } else if (message.type === InteractionType.APPLICATION_COMMAND) {
      // Handle our Slash Commands
      switch (message.data.name.toLowerCase()) {
        case INVITE_COMMAND.name.toLowerCase():
          response.status(200).send({
            type: 4,
            data: {
              content: INVITE_URL,
              flags: 64,
            },
          });
          console.log("Invite request");
          break;
        default:
          console.error("Unknown Command");
          response.status(400).send({ error: "Unknown Type" });
          break;
      }
    } else {
      console.error("Unknown Type");
      response.status(400).send({ error: "Unknown Type" });
    }
  }
};

export default discord;
