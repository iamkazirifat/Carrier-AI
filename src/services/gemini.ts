import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeCV = async (cvInput: string | { data: string; mimeType: string }) => {
  const parts = typeof cvInput === 'string' 
    ? [{ text: cvInput }] 
    : [{ inlineData: { data: cvInput.data, mimeType: cvInput.mimeType } }];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        ...parts,
        { text: "Analyze the following CV. Extract professional history, core competencies, and document formatting (hierarchy, font styles, section ordering). Store this analysis for future tailoring." }
      ]
    },
    config: {
      systemInstruction: "You are an expert Technical Recruiter. Analyze the CV and store its structure and content for future tailoring.",
    },
  });
  return response.text;
};

export const tailorCV = async (cvProfile: string, jd: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the following CV Profile and Job Description, recreate the CV. 
    Use the original formatting but rewrite bullet points to mirror the JD's primary keywords. 
    Prioritize relevant experience. Use plain, specific language. Avoid puffery.
    
    CV Profile: ${cvProfile}
    Job Description: ${jd}`,
    config: {
      systemInstruction: "You are an expert Career Strategist. Output the tailored CV in a copy-paste friendly format that maintains the original structure.",
    },
  });
  return response.text;
};

export const generateOutreach = async (tailoredCV: string, jd: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Draft a 2-3 sentence LinkedIn message for a recruiter based on this tailored CV and JD. 
    Make it punchy and value-driven.
    
    Tailored CV: ${tailoredCV}
    JD: ${jd}`,
  });
  return response.text;
};

export const generateCoverLetter = async (cv: string, jd: string, email?: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write a formal Cover Letter for the following JD using the CV data. 
    ${email ? `The contact email is ${email}.` : ""}
    
    CV: ${cv}
    JD: ${jd}`,
  });
  return response.text;
};

export const generatePortalAnswers = async (cv: string, questions: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate concise, high-impact answers for these application questions based on the CV data.
    
    CV: ${cv}
    Questions: ${questions}`,
  });
  return response.text;
};
