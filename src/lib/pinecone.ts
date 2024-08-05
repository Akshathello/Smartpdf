import { Pinecone } from "@pinecone-database/pinecone";

const getPineconeClient = new Pinecone({
  apiKey: "PINECONE_API_KEY",
  // environment:"us-east-1"
});

export default getPineconeClient;
