import { db } from "@/db";
import openAi from "@/lib/openAi"
import  getPineconeClient from "@/lib/pinecone";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { NextRequest } from "next/server";
import { StreamingTextResponse, AIStreamCallbacksAndOptions } from "ai";

// the below import is the open ai provider
import { openai } from "@ai-sdk/openai";

export const POST = async (req: NextRequest) => {
  const body = await req.json();

  const { getUser } = getKindeServerSession();

  const user = await getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: userId } = user;

  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { fileId, message } = SendMessageValidator.parse(body);

  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });
  console.log(user)

  if (!file) return new Response("Not Found", { status: 404 });

  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      userId,
      fileId,
    },
  });
};

//vectorize message to make the computer understand the words of the pdf.
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// const pineconeIndex = getPineconeClient.Index("smartpdf");
// const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
//   pineconeIndex,
//   namespace: file.id,
// });

const pinecone = await getPineconeClient()

const pineconeIndex = pinecone.Index('smartpdf')

const vectorStore = await PineconeStore.fromExistingIndex(
    embeddings,
    {
        pineconeIndex,
        namespace: file.id,
    }
)


console.log(pineconeIndex)
const results = await vectorStore.similaritySearch(message, 4);

const prevMessages = await db.message.findMany({
  where: {
    fileId,
  },
  orderBy: {
    createdAt: "asc",
  },
  take: 6,
});

console.log(results)

//     //OpenAi expects a certain fromat to recieve the message and subsequently it answere to that query. If not abided with the given order then problems can arise.

  const formattedPrevMessages = prevMessages.map((msg) => ({

    role: msg.isUserMessage ? "user" as const: "assistant" as const,
    content: msg.text
  }))

  const response = await openAi.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature:0,
    stream: true,
    messages: [
        {
            role: 'system',
            content:
              'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
          },
          {
            role: 'user',
            content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.

      \n----------------\n

      PREVIOUS CONVERSATION:
      ${formattedPrevMessages.map((message) => {
        if (message.role === 'user')
          return `User: ${message.content}\n`
        return `Assistant: ${message.content}\n`
      })}

      \n----------------\n

      CONTEXT:
      ${results.map((r) => r.pageContent).join('\n\n')}

      USER INPUT: ${message}`,
          },
    ]
  })

  const stream = openai (response , {
    async onCompletion (completion: string) {
     await db.message.create({
      data: {
        text: completion,
        isUserMessage: false,
        fileId,
        userId
      }
     })
    }
  })

  return new StreamingTextResponse(stream)

}
