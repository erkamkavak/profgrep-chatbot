import { type ToolName, toolNameSchema } from "../types";

export const toolsDefinitions: Record<ToolName, ToolDefinition> = {
  // getWeather: {
  //   name: "getWeather",
  //   description: "Get the weather in a specific location",
  //   cost: 1,
  // },
  // createDocument: {
  //   name: "createDocument",
  //   description: "Create a new document",
  //   cost: 5,
  // },
  // updateDocument: {
  //   name: "updateDocument",
  //   description: "Update a document",
  //   cost: 5,
  // },
  // requestSuggestions: {
  //   name: "requestSuggestions",
  //   description: "Request suggestions for a document",
  //   cost: 1,
  // },
  // readDocument: {
  //   name: "readDocument",
  //   description: "Read the content of a document",
  //   cost: 1,
  // },
  // // reasonSearch: {
  // //   name: 'reasonSearch',
  // //   description: 'Search with reasoning',
  // //   cost: 50,
  // // },
  // retrieve: {
  //   name: "retrieve",
  //   description: "Retrieve information from the web",
  //   cost: 1,
  // },
  // webSearch: {
  //   name: "webSearch",
  //   description: "Search the web",
  //   cost: 3,
  // },
  mgrepSearch: {
    name: "mgrepSearch",
    description: "Search through mgrep-indexed files using natural language queries",
    cost: 2,
  },
  mgrepStatus: {
    name: "mgrepStatus",
    description: "Check mgrep CLI status and available stores",
    cost: 1,
  },
  getProfessorsByInstitution: {
    name: "getProfessorsByInstitution",
    description: "Get a list of professors/authors for a given institution via OpenAlex.",
    cost: 2,
  },
  getInstitutionsByPlace: {
    name: "getInstitutionsByPlace",
    description: "Get a list of institutions for a given country/place/region via OpenAlex.",
    cost: 2,
  },
  searchAuthors: {
    name: "searchAuthors",
    description: "Search OpenAlex authors (professors) by name or keywords.",
    cost: 1,
  },
  searchInstitutions: {
    name: "searchInstitutions",
    description: "Search OpenAlex institutions by name or keywords.",
    cost: 1,
  },
  // codeInterpreter: {
  //   name: "codeInterpreter",
  //   description: "Interpret code in a virtual environment",
  //   cost: 10,
  // },
  // generateImage: {
  //   name: "generateImage",
  //   description: "Generate images from text descriptions",
  //   cost: 50,
  // },
  // deepResearch: {
  //   name: "deepResearch",
  //   description: "Research a topic",
  //   cost: 50,
  // },
};

export const allTools = toolNameSchema.options;
export type ToolDefinition = {
  name: string;
  description: string;
  cost: number;
};
