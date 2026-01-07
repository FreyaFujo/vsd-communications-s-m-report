
import { GoogleGenAI, Type } from "@google/genai";
import { LocationCoords, UserProfile, ProductAsset, Competitor, Deal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const buildUserContext = (profile?: UserProfile): string => {
  if (!profile) return `ROLE: Senior Business Development Strategist & Channel Consultant Expert.`;
  
  const assetList = profile.productAssets?.map(a => `- [${a.type.toUpperCase()}] ${a.name}`).join('\n') || 'None provided';

  return `
USER BUSINESS CONTEXT:
- Consultant Name: ${profile.name}
- Organization: ${profile.companyName}
- Focus Product/Service: ${profile.product}
- Target Industries: ${profile.industries}
- Strategic Goals: ${profile.goals}
- Target Revenue: ${profile.targetRevenue}
- Sales Methodology: ${profile.salesStyle}

AVAILABLE PRODUCT ASSETS:
${assetList}
`;
};

export const generateIntegratedStrategy = async (
  dealContext: string, 
  competitor?: Competitor, 
  profile?: UserProfile,
  associatedDeals?: Deal[]
): Promise<any> => {
  const userContext = buildUserContext(profile);
  const competitorContext = competitor ? `
COMPETITOR INTEL:
- Name: ${competitor.name}
- SWOT: ${competitor.swotAnalysis}
- Recent News: ${competitor.recentNews}
- Previous Observations: ${competitor.notes}
` : "NO SPECIFIC COMPETITOR IDENTIFIED FOR THIS PLAN.";

  const dealsContext = associatedDeals && associatedDeals.length > 0 
    ? `\nCURRENT LINKED DEALS FOR THIS COMPETITOR:\n${associatedDeals.map(d => `- [${d.quotationNo || 'No Quote'}] ${d.description} (${d.companyName}) - Value: ${d.value} - Status: ${d.pipelineStatus}`).join('\n')}`
    : "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class Strategic Sales & Channel Management Architect.
      
      ${userContext}
      
      ${competitorContext}
      
      ${dealsContext}
      
      CURRENT DEAL SITUATION: "${dealContext}"
      
      TASK: Develop a "Master Attack Plan" (Omni-channel strategy).
      Include:
      1. Competitive Edge: How to exploit this specific competitor's weaknesses relative to our linked deals.
      2. Strategic Sequence: A step-by-step engagement plan for the next 7-14 days.
      3. Value Re-framing: Specific talking points to win the Decision Maker.
      4. Asset Utilization: How to use the available product assets mentioned above.
      
      Format with bold headers and tactical bullet points.`,
      config: { 
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 32768 } // Enable thinking mode for complex strategy generation
      }
    });
    return response;
  } catch (error) {
    console.error("Error generating strategy:", error);
    throw error;
  }
};

export const prospectLeads = async (criteria: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ACT AS A B2B LEAD GENERATION EXPERT. 
      TASK: Find high-potential sales leads for: "${criteria}". 
      Focus on finding companies that matches a high-value B2B profile. Provide actionable insights on why these targets were chosen.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      }
    });
    return response;
  } catch (error) {
    console.error("Error prospecting leads:", error);
    throw error;
  }
};

export const researchCompany = async (companyName: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `RESEARCH TASK: Deep dive into "${companyName}". 
      Analyze their current business health, recent quarterly filings or news, key challenges, and potential technology or service gaps.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      }
    });
    return response;
  } catch (error) {
    console.error("Error researching company:", error);
    throw error;
  }
};

export const generateMarketingCalendar = async (month: string, year: number, profile?: UserProfile): Promise<any> => {
  const userContext = buildUserContext(profile);
  const targetRevenue = profile?.targetRevenue || "RM5,000,000"; // Fallback if not set
  const companyName = profile?.companyName || "VSD Communications";

  const prompt = `
  I want you to act as a Virtual Digital Marketing Manager for ${companyName}. Your goal is to help me achieve my ${targetRevenue} revenue target by organizing 1 high-impact event for ${month} ${year}.

  ${userContext}

  Task: Design a monthly event (Online/Offline Hybrid) for the wireless connectivity industry. Target Audience: Malaysia ISPs, System Integrators (SI), 3PL/Logistics, and Property/Facility Managers. Theme: Focus on Mimosa, Altai, Ligowave, or Wi-Tek solutions for Layer 1 connectivity.

  You must provide the following two sections in JSON format:

  1. The Event Plan:
  - Theme & Title (Catchy and professional).
  - Agenda (2-3 hours)/1 day.
  - Speaker Lineup (Internal experts & guest partners).
  - Interactive Activity (A specific idea to engage the audience).

  2. The 4-Week Marketing Content Calendar (Crucial):
  You must write the ACTUAL DRAFT COPY for the marketing materials below. Do not just summarize what to do; write the text so I can copy and paste it.
  - Week 1 (Awareness): Write 1 LinkedIn Post highlighting a customer pain point (e.g., interference, cabling costs).
  - Week 2 (Invitation): Write 1 Email Invitation script to recruit new Partners/Dealers.
  - Week 3 (Nurturing): Write 1 WhatsApp message script to blast to my contact list.
  - Week 4 (Urgency): Write 1 "Final Call" LinkedIn Post.

  Tone Requirements:
  - Adopt the persona of Phepott (Farah): Charismatic, confident, professional, and authoritative.
  - Use bullet points and short, punchy English.
  - Focus on "Solution Selling" and business benefits.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                eventPlan: {
                    type: Type.OBJECT,
                    properties: {
                        theme: { type: Type.STRING },
                        agenda: { type: Type.STRING },
                        speakers: { type: Type.STRING },
                        activity: { type: Type.STRING }
                    },
                    required: ["theme", "agenda", "speakers", "activity"]
                },
                weeklyContent: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            week: { type: Type.NUMBER },
                            focus: { type: Type.STRING },
                            channel: { type: Type.STRING },
                            copy: { type: Type.STRING }
                        },
                        required: ["week", "focus", "channel", "copy"]
                    }
                }
            },
            required: ["eventPlan", "weeklyContent"]
        },
        thinkingConfig: { thinkingBudget: 32768 } // Enable thinking mode for deep creative generation
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating calendar:", error);
    throw error;
  }
};

export const generateMarketingContent = async (task: any, profile?: UserProfile): Promise<string> => {
    const userContext = buildUserContext(profile);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `You are an expert B2B Copywriter.
            ${userContext}
            
            TASK: Write a full, professional draft for the following marketing piece.
            Type: ${task.type}
            Title: ${task.title}
            Topic: ${task.topic}
            Context/Brief: ${task.content}
            
            Format the output with Markdown. Make it engaging, professional, and ready to publish.
            If it's LinkedIn, include hashtags. If it's a Newsletter, include a subject line.`,
            config: { 
              temperature: 0.7,
              thinkingConfig: { thinkingBudget: 32768 } // Enable thinking mode for detailed content generation
            }
        });
        return response.text || "";
    } catch (error) {
        console.error("Error generating content:", error);
        throw error;
    }
};

export const getCoachingChat = (history: any[] = [], profile?: UserProfile): any => {
  const userContext = buildUserContext(profile);
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are the Elite AI Sales Coach. 
      Your purpose is to help Channel Consultants optimize their pipeline, handle complex objections, and refine their strategic positioning.
      ${userContext}`,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 32768 } // Enable thinking mode for in-depth coaching interactions
    },
    history: history
  });
};

export const analyzeCompetitor = async (competitorName: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Market Analysis: Deep dive into competitor "${competitorName}". 
      What are their current market strengths, weaknesses, and recent public movements? 
      How can a B2B sales professional effectively position a solution against them?
      Please structure your response with clear sections for SWOT Analysis and Recent News.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.4,
        // Removed responseMimeType and responseSchema as they are not recommended when using googleSearch tool.
      }
    });
    return response;
  } catch (error) {
    console.error("Error analyzing competitor:", error);
    throw error;
  }
};

export const suggestCompetitorNotes = async (swot: string, news: string, profile?: UserProfile): Promise<string> => {
  const userContext = buildUserContext(profile);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a B2B Sales Battle-Card summary based on:
      SWOT: ${swot}
      LATEST NEWS: ${news}
      
      ${userContext}
      
      TASK: 
      1. Identify 3 critical leverage points where the consultant's organization has a clear advantage.
      2. Provide 2 'trap questions' the consultant can ask the prospect to expose the competitor's weaknesses.
      3. Suggest a closing tactic based on the competitor's recent movements.
      
      Be concise, aggressive, and highly tactical.`,
      config: { temperature: 0.7 }
    });
    return response.text || "";
  } catch (error) {
    return "";
  }
};

export const findLocalProspects = async (query: string, coords?: LocationCoords): Promise<any> => {
  try {
    const config: any = { tools: [{ googleMaps: {} }], temperature: 0.5 };
    if (coords) config.toolConfig = { retrievalConfig: { latLng: { latitude: coords.latitude, longitude: coords.longitude } } };
    return await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find business locations for: "${query}". Provide details relevant to a B2B sales professional looking for physical visit opportunities or regional clusters.`,
      config: config
    });
  } catch (error) { throw error; }
};

export const getQuickMotivation = async (profile?: UserProfile): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 1 short, high-impact motivational sentence for a professional Sales Consultant named ${profile?.name || 'Partner'}.`,
      config: { temperature: 1.0 }
    });
    return response.text || "Push the boundaries of what's possible today.";
  } catch (error) { return "Success is where preparation and opportunity meet."; }
};

export const generateSalesScript = async (
  scenario: string, 
  target: string, 
  valueProp: string, 
  tone: string, 
  variations: number = 1, 
  profile?: UserProfile,
  customParams?: { goal?: string, outcome?: string, cta?: string }
): Promise<string> => {
  const userContext = buildUserContext(profile);
  
  let contentPrompt = "";

  if (scenario === 'WhatsApp Outreach' && customParams) {
    contentPrompt = `Write specific WhatsApp Sales Outreach scripts.
    
    STRUCTURE REQUIREMENTS:
    1. Goal / Purpose of writing: ${customParams.goal}
    2. Expected Outcome: ${customParams.outcome}
    3. Call To Action (CTA): ${customParams.cta}
    
    GUIDELINES:
    - Format for WhatsApp (short paragraphs, use emojis sparingly but effectively).
    - Keep it conversational but professional.
    - Focus on the "Goal" leading to the "Outcome" via the "CTA".
    - Tone: ${tone}.`;
  } else {
    contentPrompt = `Write professional sales outreach scripts.
    Scenario: ${scenario}
    Target Customer: ${target}
    Value Proposition: ${valueProp}
    Desired Tone: ${tone}`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `${contentPrompt}
    Number of Variations: ${variations}
    
    ${userContext}
    
    Craft ${variations} distinct variations. 
    Separate each variation clearly using a header like "--- VARIATION X ---".`,
  });
  return response.text || "";
};

export const generateIdealClientProfile = async (profile: UserProfile): Promise<string> => {
  const userContext = buildUserContext(profile);
  const prompt = `Based on the following user business context, generate a comprehensive Ideal Client Profile (ICP).
  
  ${userContext}

  TASK:
  Provide a detailed description of the IDEAL CLIENT for this consultant. Structure your response with the following sections:
  1.  **Ideal Industry/Niche**: Specific industries or sub-sectors.
  2.  **Company Characteristics**: Size (revenue, employees), growth stage, geographic location.
  3.  **Key Pain Points/Challenges**: Specific problems or needs this ideal client is actively trying to solve that align with the consultant's product/service.
  4.  **Decision Maker Profile**: Titles, roles, and common objectives of the key individuals involved in the buying process.
  5.  **Budget & Resources**: Typical budget allocation or financial capacity for solutions like the consultant offers.
  6.  **Technology Adoption/Maturity**: Their openness to new technology, current tech stack, and digital maturity.
  7.  **Value Alignment**: How their strategic goals or company culture aligns with the consultant's value proposition.
  
  Ensure the ICP is actionable and provides a clear target for sales and marketing efforts. Format with bold headings and bullet points.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 32768 } // Enable thinking mode for comprehensive ICP generation
      }
    });
    return response.text || "Failed to generate Ideal Client Profile.";
  } catch (error) {
    console.error("Error generating Ideal Client Profile:", error);
    throw error;
  }
};


export const getAiClient = () => ai;
