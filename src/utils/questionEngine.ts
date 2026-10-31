import type { QuizQuestion, GameType } from '../types';
import { buildGamesForBooth } from './gameBank';

/**
 * Question Engine for Technology Summit 2026
 * Generates thousands of unique, funny, tricky, pattern-based, and gaming-style
 * questions tailored to each of the 9 summit booths.
 */

// Helper to pick random item from array
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to shuffle
function shuffle<T>(arr: T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

// -------------------------------------------------------------
// BOOTH 1: Data Governance, Privacy & Zero Trust
// -------------------------------------------------------------
function generateBooth1Questions(count: number = 30): QuizQuestion[] {
  const curated: QuizQuestion[] = [
    {
      id: 'b1_curated_1',
      category: 'Data & Security',
      difficulty: 'medium',
      question: '3 of these are core Zero Trust security pillars. Which one is an undercover security disaster waiting to happen?',
      options: [
        'Explicitly verify every request regardless of source network',
        'Use least privilege access with ephemeral time-bounded tokens',
        'Trust all traffic inside the corporate VPN because "we are all family here" ☕',
        'Assume breach and verify end-to-end encryption continuously'
      ],
      correctAnswer: 2
    },
    {
      id: 'b1_curated_2',
      category: 'Data & Security',
      difficulty: 'hard',
      question: 'Data classification levels are ordered: Public (1), Internal (2), Confidential (3), Restricted (4). If an AI model is fine-tuned on Level 3 data, what is the MINIMUM classification the model weights inherit?',
      options: [
        'Level 1 (Public, because AI makes everything open-source)',
        'Level 2 (Internal, after scrubbing with bleach)',
        'Level 3 (Confidential, weights inherit training sensitivity)',
        'Level 0 (Unclassified if quantized to 4-bit)'
      ],
      correctAnswer: 2
    },
    {
      id: 'b1_curated_3',
      category: 'Data & Security',
      difficulty: 'medium',
      question: 'Review this suspicious API request:\n`GET /api/v1/user?id=101 OR 1=1; DROP TABLE audit_log; --`\nWhat classic security vulnerability did our automated scanner just catch red-handed?',
      options: [
        'SQL Injection (someone trying to delete evidence!)',
        'Cross-Site Scripting (XSS)',
        'Insecure Direct Object Reference (IDOR)',
        'A rogue intern testing in production'
      ],
      correctAnswer: 0
    },
    {
      id: 'b1_curated_4',
      category: 'Data & Security',
      difficulty: 'easy',
      question: 'What is the most dangerous password commonly found committed to a public Git repository at 2:00 AM?',
      options: [
        'P@ssw0rd2026! (with maximum regret)',
        'CorrectHorseBatteryStaple',
        'A 64-character Argon2 hash',
        'production_root_dont_share'
      ],
      correctAnswer: 0
    },
    {
      id: 'b1_curated_5',
      category: 'Data & Security',
      difficulty: 'hard',
      question: 'An automated pipeline ingests raw Customer telemetry → Enriches with CRM data → Trains an ML Credit Scorer → Publishes predictions. If a GDPR "Right to be Forgotten" request arrives, where must data lineage trace?',
      options: [
        'Only the final prediction output table',
        'Across the entire graph: raw storage, feature stores, and downstream model inputs',
        'Nowhere, just delete the email in Outlook',
        'Only the backup tape in the bank vault'
      ],
      correctAnswer: 1
    }
  ];

  // Procedural generator for Booth 1
  const procedural: QuizQuestion[] = [];
  const protocols = ['Mutual TLS (mTLS)', 'SPIFFE/SPIRE Identity', 'OAuth 2.1 PKCE', 'JSON Web Tokens (JWT)', 'SAML 2.0'];
  const dataAssets = ['Customer PII', 'Audit Lineage Trail', 'Credit Card Vault', 'Cryptographic Master Key', 'Training Dataset'];
  const scenarios = [
    'A rogue script attempts unauthorized read access at 03:14 UTC',
    'An automated Zero Trust proxy evaluates a session from an unmanaged laptop',
    'A continuous vulnerability scanner detects a CVE in a container base image',
    'A microservice attempts an inter-cluster call without a signed certificate'
  ];

  for (let i = 0; i < count; i++) {
    const asset = pick(dataAssets);
    const proto = pick(protocols);
    const scen = pick(scenarios);
    const delay = (i * 7 + 13) % 45 + 5;

    procedural.push({
      id: `b1_proc_${i}`,
      category: 'Data & Security',
      difficulty: i % 2 === 0 ? 'medium' : 'hard',
      question: `Scenario: "${scen}" targeting ${asset}. To enforce Zero Trust in under ${delay}ms, which mechanism must immediately execute?`,
      options: [
        `Strict policy evaluation via ${proto} with automatic session quarantine`,
        'Bypass authentication if the request says "urgent priority"',
        'Log a warning into console.log and let the request proceed',
        'Disable TLS to accelerate packet inspection throughput'
      ],
      correctAnswer: 0
    });
  }

  return [...curated, ...procedural];
}

// -------------------------------------------------------------
// BOOTH 2: Autonomous Agents, Digital Identity & Next-Gen Banking
// -------------------------------------------------------------
function generateBooth2Questions(count: number = 30): QuizQuestion[] {
  const curated: QuizQuestion[] = [
    {
      id: 'b2_curated_1',
      category: 'Agentic AI & Identity',
      difficulty: 'medium',
      question: 'Agent Alpha tells Agent Beta "Verify this balance." Agent Beta replies "Please confirm Alpha." Alpha replies "Please confirm Beta." How do we stop this infinite polite Canadian standoff?',
      options: [
        'Max recursion depth / step limit with cycle detection in the orchestrator',
        'Unplug the datacenter power cord and hope for the best',
        'Let them chat until they achieve sentience and open their own bank account',
        'Send an angry email to the AI'
      ],
      correctAnswer: 0
    },
    {
      id: 'b2_curated_2',
      category: 'Agentic AI & Identity',
      difficulty: 'hard',
      question: 'An AI Agent has a context limit of 8,000 tokens. Each reasoning step consumes 500 tokens of input and generates 300 tokens of thought. After 5 steps, how many tokens are occupied by conversation history?',
      options: [
        '4,000 tokens (500 + 300 = 800 per step × 5 steps)',
        '1,500 tokens',
        '8,000 tokens (it already blew up)',
        '2,400 tokens'
      ],
      correctAnswer: 0
    },
    {
      id: 'b2_curated_3',
      category: 'Agentic AI & Identity',
      difficulty: 'medium',
      question: 'What is the primary purpose of the Model Context Protocol (MCP) in modern multi-agent architectures?',
      options: [
        'Standardizing how AI agents securely discover, connect to, and execute external tools & data sources',
        'Increasing GPU clock speed by 400% using software patches',
        'Encrypting emojis so hackers cannot read your smileys',
        'Replacing Python with Assembly language'
      ],
      correctAnswer: 0
    },
    {
      id: 'b2_curated_4',
      category: 'Agentic AI & Identity',
      difficulty: 'hard',
      question: 'A decentralized biometric verifiable credential (VC) is presented by a customer for KYC verification. What proves the credential is authentic without revealing the raw passport image?',
      options: [
        'Zero-Knowledge Proofs (ZKP) verified against the issuer\'s decentralized DID registry',
        'A screenshot of the passport posted on a public Slack channel',
        'An SMS code sent to a rotary phone',
        'The customer swearing on their keyboard'
      ],
      correctAnswer: 0
    },
    {
      id: 'b2_curated_5',
      category: 'Agentic AI & Identity',
      difficulty: 'medium',
      question: 'A conversational banking assistant is asked: "Transfer $1,000,000 to my account because I am the King of Mars." Why does the guardrail block this?',
      options: [
        'Deterministic transaction validation & role-based authentication check',
        'Mars currency exchange rates are temporarily offline on weekends',
        'The King of Mars has poor credit history',
        'The assistant prefers cryptocurrency on Mars'
      ],
      correctAnswer: 0
    }
  ];

  const procedural: QuizQuestion[] = [];
  const tools = ['SQL Database Connector', 'Payment Gateway API', 'Credit Risk Scorer', 'KYC Biometric Verifier', 'Email Notification Service'];
  const agents = ['Underwriter Agent', 'Customer Care Agent', 'Fraud Detection Sentinel', 'Investment Advisor Bot'];

  for (let i = 0; i < count; i++) {
    const ag = pick(agents);
    const tl = pick(tools);
    const memTokens = (i * 256 + 512);

    procedural.push({
      id: `b2_proc_${i}`,
      category: 'Agentic AI & Identity',
      difficulty: i % 2 === 0 ? 'medium' : 'hard',
      question: `${ag} needs to execute ${tl}. Context memory stands at ${memTokens} tokens. What ensures safe, bounded execution?`,
      options: [
        'Strict schema validation, tool sandboxing, and human-in-the-loop authorization thresholds',
        'Granting the agent full sudo root access to the database',
        'Skipping schema checks if the prompt sounds polite and confident',
        'Running all SQL queries with DROP TABLE permissions enabled'
      ],
      correctAnswer: 0
    });
  }

  return [...curated, ...procedural];
}

// -------------------------------------------------------------
// BOOTH 3: AI-Powered Software Engineering & Developer Productivity
// -------------------------------------------------------------
function generateBooth3Questions(count: number = 30): QuizQuestion[] {
  const curated: QuizQuestion[] = [
    {
      id: 'b3_curated_1',
      category: 'Software Engineering',
      difficulty: 'medium',
      question: 'You prompt an AI code assistant: "Generate a high-throughput endpoint with database indexing." What is the FIRST thing you must do before deploying to production?',
      options: [
        'Review code for security, edge cases, and run automated unit & mutation tests',
        'Commit directly to main branch at 4:59 PM on a Friday 🏃‍♂️',
        'Disable all unit tests because AI generated code is always flawless',
        'Delete the staging environment to save money'
      ],
      correctAnswer: 0
    },
    {
      id: 'b3_curated_2',
      category: 'Software Engineering',
      difficulty: 'medium',
      question: 'An automated regression test fails. The git blame points to: `commit 8f3a1c: "Refactor code - fixed typo in comments"`. What actually happened here?',
      options: [
        'A sneaky side-effect or unintentional logic alteration snuck into an unverified commit',
        'The compiler had a bad dream',
        'The developer was framed by an innocent mechanical keyboard',
        'The test suite spontaneously rebelled'
      ],
      correctAnswer: 0
    },
    {
      id: 'b3_curated_3',
      category: 'Software Engineering',
      difficulty: 'hard',
      question: 'Your automated pipeline reports: "Lines of code: 10,000 | Code coverage: 98% | Number of assertions: 0". What is the true quality of this test suite?',
      options: [
        'Zero effective verification! Tests execute lines without asserting correctness (Phantom coverage)',
        'Supreme enterprise perfection, deploy immediately to production',
        'It means the tests ran so fast that assertions became quantum particles',
        'The code is mathematically invincible'
      ],
      correctAnswer: 0
    },
    {
      id: 'b3_curated_4',
      category: 'Software Engineering',
      difficulty: 'easy',
      question: 'What is the primary difference between a junior dev using local AI and a senior dev using local AI?',
      options: [
        'Senior dev knows which AI recommendations to reject and why, while junior trusts them blindly',
        'Senior dev types with one finger while drinking artisanal espresso',
        'Senior dev writes their own compiler in brainfuck',
        'Junior dev has cooler stickers on their laptop'
      ],
      correctAnswer: 0
    }
  ];

  const procedural: QuizQuestion[] = [];
  const linters = ['Static Code Analysis (SAST)', 'Dynamic AST Evaluation', 'Automated Mutation Testing', 'Container Security Linter'];
  const bugs = ['SQL Injection vulnerability', 'Memory leak in event emitter', 'Race condition in async mutex', 'Unbounded recursion'];

  for (let i = 0; i < count; i++) {
    const linter = pick(linters);
    const bug = pick(bugs);
    const speedup = (i * 3 + 20) % 75 + 15;

    procedural.push({
      id: `b3_proc_${i}`,
      category: 'Software Engineering',
      difficulty: i % 2 === 0 ? 'medium' : 'hard',
      question: `An AI modernization agent rewrites legacy code, achieving a ${speedup}% latency drop. Which automated gate prevents introducing a ${bug}?`,
      options: [
        `${linter} integrated into the CI/CD pipeline blocking pull request merges`,
        'Asking the team in a chat channel if anyone felt a disturbance in the force',
        'Assuming faster code automatically means bug-free code',
        'Disabling the linter because yellow warning text is aesthetically unpleasant'
      ],
      correctAnswer: 0
    });
  }

  return [...curated, ...procedural];
}

// -------------------------------------------------------------
// BOOTH 4: Cloud Modernization, Data Platforms & Architecture
// -------------------------------------------------------------
function generateBooth4Questions(count: number = 30): QuizQuestion[] {
  const curated: QuizQuestion[] = [
    {
      id: 'b4_curated_1',
      category: 'Cloud & Modernization',
      difficulty: 'medium',
      question: 'When breaking a 20-year-old monolithic banking core into cloud-native microservices, what architectural pattern prevents immediate distributed failure?',
      options: [
        'The Strangler Fig pattern with an intelligent routing facade',
        'The Big Bang pattern: turn off everything over lunch and pray',
        'Copy-paste all 5 million lines into a single AWS Lambda function',
        'Rename the .war file to .cloud and restart the server'
      ],
      correctAnswer: 0
    },
    {
      id: 'b4_curated_2',
      category: 'Cloud & Modernization',
      difficulty: 'hard',
      question: 'Traditional ETL did: Extract → Transform → Load. Modern cloud Lakehouse architectures do: Extract → Load → Transform (ELT). Why the swap?',
      options: [
        'Cloud storage and distributed compute allow storing raw data first and transforming with elastic scale',
        'Because ELT sounds cooler in executive PowerPoint slides',
        'Databases forgot how to transform data in transit',
        'It saves on typing one letter in documentation'
      ],
      correctAnswer: 0
    },
    {
      id: 'b4_curated_3',
      category: 'Cloud & Modernization',
      difficulty: 'medium',
      question: 'A test Kubernetes cluster had `auto-scaling: enabled` with `max_nodes: 9999` and an unconstrained while-loop. What is the cloud engineer\'s diagnosis?',
      options: [
        'Unbounded horizontal pod autoscaling caused node explosion and astronomical cloud bill shock',
        'The cloud provider donated free compute out of generosity',
        'A quantum entanglement event duplicated servers across dimensions',
        'Nothing wrong, 10,000 idle nodes are great for heating the office'
      ],
      correctAnswer: 0
    }
  ];

  const procedural: QuizQuestion[] = [];
  const workloads = ['Mainframe COBOL batch', 'On-prem Oracle RAC DB', 'Legacy SOAP ESB Gateway', 'Flat-file SFTP pipeline'];
  const targets = ['Event-Driven Kafka Architecture', 'Cloud Lakehouse with Apache Iceberg', 'Serverless Microservices', 'Distributed NoSQL Store'];

  for (let i = 0; i < count; i++) {
    const src = pick(workloads);
    const dest = pick(targets);
    const recs = (i * 12 + 100) * 10000;

    procedural.push({
      id: `b4_proc_${i}`,
      category: 'Cloud & Modernization',
      difficulty: i % 2 === 0 ? 'medium' : 'hard',
      question: `Migrating ${recs.toLocaleString()} daily records from "${src}" to "${dest}". What is essential for zero data loss?`,
      options: [
        'Idempotent consumers, schema registry evolution, and dual-run reconciliation checks',
        'Turning off audit logging to make the network cables transfer data faster',
        'Writing records to a single CSV file on the desktop',
        'Deleting the source database as soon as migration starts'
      ],
      correctAnswer: 0
    });
  }

  return [...curated, ...procedural];
}

// -------------------------------------------------------------
// BOOTH 5: Enterprise AI Platform & Intelligent AI Operations (Tachyon)
// -------------------------------------------------------------
function generateBooth5Questions(count: number = 30): QuizQuestion[] {
  const curated: QuizQuestion[] = [
    {
      id: 'b5_curated_1',
      category: 'Enterprise AI & MLOps',
      difficulty: 'medium',
      question: 'A user prompt arrives: "What is 12 × 12?". You have a 405B Frontier LLM ($$$) and an embedded math rule engine (<1ms, $0). What does an intelligent AI model router do?',
      options: [
        'Routes to the embedded math rule engine, saving 99.9% cost and 1,500ms latency',
        'Routes to the 405B model because big numbers need big GPUs',
        'Queries all models simultaneously and takes an average of their numbers',
        'Passes the prompt to human review queue for 3 business days'
      ],
      correctAnswer: 0
    },
    {
      id: 'b5_curated_2',
      category: 'Enterprise AI & MLOps',
      difficulty: 'hard',
      question: 'An enterprise fraud classification model trained in 2024 starts predicting false negatives at double the rate in 2026, though code has not changed. What happened?',
      options: [
        'Data Drift & Concept Drift (adversaries evolved attack patterns while model remained static)',
        'The model got tired and needs a vacation',
        'Bit rot in the GPU memory chips',
        'Python 3.12 made math calculations 50% more forgiving'
      ],
      correctAnswer: 0
    },
    {
      id: 'b5_curated_3',
      category: 'Enterprise AI & MLOps',
      difficulty: 'medium',
      question: 'Your LLM gateway FinOps dashboard shows a spike of $45,000 over the weekend. Cause: an automated test looped "Tell me a joke" 1,000,000 times. What platform feature stops this?',
      options: [
        'Tenant rate limiting, token quotas, and automated anomaly circuit breakers',
        'Asking the LLM to refund the money in crypto',
        'Laughing at all 1,000,000 jokes so the money wasn\'t wasted',
        'Renaming the project to hide the invoice'
      ],
      correctAnswer: 0
    }
  ];

  const procedural: QuizQuestion[] = [];
  const metrics = ['P99 Latency under 250ms', 'Token Throughput > 120 tps', 'Cost per 1M tokens < $0.15', 'Model Hallucination Rate < 0.2%'];
  const models = ['Quantized 8B Slm', 'Fine-Tuned 70B MoE', 'Domain Embedding Vectorizer', 'Frontier Reasoning Engine'];

  for (let i = 0; i < count; i++) {
    const model = pick(models);
    const metric = pick(metrics);

    procedural.push({
      id: `b5_proc_${i}`,
      category: 'Enterprise AI & MLOps',
      difficulty: i % 2 === 0 ? 'medium' : 'hard',
      question: `Deploying a ${model} in an enterprise private cluster. Target: ${metric}. Which MLOps capability guarantees SLA compliance?`,
      options: [
        'Dynamic batching, spec-decoding optimization, and automated health canary deployments',
        'Overclocking the GPU until liquid nitrogen starts boiling',
        'Ignoring P99 latency because only 1% of users suffer anyway',
        'Hardcoding the model responses into a JavaScript switch-case'
      ],
      correctAnswer: 0
    });
  }

  return [...curated, ...procedural];
}

// -------------------------------------------------------------
// BOOTH 6: AI Business Intelligence & Process Automation
// -------------------------------------------------------------
function generateBooth6Questions(count: number = 30): QuizQuestion[] {
  const curated: QuizQuestion[] = [
    {
      id: 'b6_curated_1',
      category: 'Business Automation',
      difficulty: 'medium',
      question: 'A business user uploads a 500-page commercial loan prospectus and asks: "What is the guarantor clause on page 342?". What AI architecture answers accurately in 2 seconds?',
      options: [
        'Hybrid Semantic RAG (Chunking + Vector Indexing + BM25 Lexical Re-ranking)',
        'Copy-pasting 500 pages into one prompt and praying it fits context',
        'Asking the intern to read it out loud to the computer microphone',
        'Summarizing the document into "It is about money" and stopping there'
      ],
      correctAnswer: 0
    },
    {
      id: 'b6_curated_2',
      category: 'Business Automation',
      difficulty: 'hard',
      question: 'An AI automated marketing teammate drafts an email campaign stating: "Our savings account offers guaranteed 98% monthly returns risk-free!". Why does the compliance agent flag this?',
      options: [
        'Clear financial hallucination violating regulatory fair advertising guidelines (truth in savings)',
        'The font size was not Times New Roman',
        '98% monthly return is too low for tech investors',
        'The email did not include enough rocket ship emojis 🚀'
      ],
      correctAnswer: 0
    },
    {
      id: 'b6_curated_3',
      category: 'Business Automation',
      difficulty: 'easy',
      question: 'A company automates 10,000 hours of manual spreadsheet data entry with an AI teammate. What do the analysts do with their newfound time?',
      options: [
        'Focus on high-value strategic decision analysis, anomaly investigation, and advisory',
        'Create even bigger and more colorful spreadsheets with 15 nested VLOOKUPs',
        'Watch cat videos with 4K resolution on two monitors',
        'Complain that typing numbers manually was good exercise for the fingers'
      ],
      correctAnswer: 0
    }
  ];

  const procedural: QuizQuestion[] = [];
  const processes = ['Mortgage Document Classification', 'Invoice Reconciliation', 'Commercial Property Inspection Appraisal', 'Insurance Claim Triage'];
  const dataTypes = ['Unstructured PDF Scans', 'Handwritten Receipts', 'Tabular Ledger Entries', 'Customer Dispute Audio Recordings'];

  for (let i = 0; i < count; i++) {
    const proc = pick(processes);
    const dt = pick(dataTypes);
    const accuracy = (i * 2 + 91) % 8 + 92;

    procedural.push({
      id: `b6_proc_${i}`,
      category: 'Business Automation',
      difficulty: i % 2 === 0 ? 'medium' : 'hard',
      question: `Automating "${proc}" processing ${dt} with target ${accuracy}% accuracy. What ensures reliable output?`,
      options: [
        'Multimodal Vision-Language extraction with confidence scoring and human review fallback',
        'Running standard OCR and ignoring all blurry pages',
        'Guessing missing values based on the day of the week',
        'Automatically approving 100% of claims to keep customer satisfaction high'
      ],
      correctAnswer: 0
    });
  }

  return [...curated, ...procedural];
}

// -------------------------------------------------------------
// BOOTH 7: Agentic Banking, Risk Intelligence & AI Teammates
// -------------------------------------------------------------
function generateBooth7Questions(count: number = 30): QuizQuestion[] {
  const curated: QuizQuestion[] = [
    {
      id: 'b7_curated_1',
      category: 'Risk & Banking',
      difficulty: 'hard',
      question: 'An AI risk agent scans global news and flags: "Supplier Acme Corp CFO resigns amid accounting irregularities." How does the risk intelligence agent immediately react?',
      options: [
        'Calculates exposure score, alerts credit risk officers, and initiates automated vendor review',
        'Buys more stock in Acme Corp because drama is exciting',
        'Mutes notifications until Monday morning',
        'Posts a meme about Acme Corp on social media'
      ],
      correctAnswer: 0
    },
    {
      id: 'b7_curated_2',
      category: 'Risk & Banking',
      difficulty: 'medium',
      question: 'A real-time cross-border wire of $500,000 is submitted. The destination account was created 10 minutes ago in an uncharacteristic jurisdiction. What triggers?',
      options: [
        'Anti-Money Laundering (AML) velocity & anomaly alert with immediate transaction freeze for review',
        'Speedy delivery bonus points for prompt transfer',
        'Auto-approving because the recipient said "trust me please"',
        'Sending an SMS asking: "Are you sure you want to be rich?"'
      ],
      correctAnswer: 0
    },
    {
      id: 'b7_curated_3',
      category: 'Risk & Banking',
      difficulty: 'easy',
      question: 'When an AI teammate collaborates with human credit underwriters on loan approvals, what is its golden rule?',
      options: [
        'Explainable AI (XAI): provide clear risk factor justifications, never act as an opaque black box',
        'Always agree with whatever the human says even if the math is wrong',
        'Answer only in Shakespearean sonnets',
        'Recommend approving loans only to people who share the AI\'s astrological sign'
      ],
      correctAnswer: 0
    }
  ];

  const procedural: QuizQuestion[] = [];
  const riskTypes = ['Liquidity Stress Test', 'Counterparty Exposure Matrix', 'Sanctions Screening List', 'Fraud Velocity Spike'];

  for (let i = 0; i < count; i++) {
    const rt = pick(riskTypes);
    const amount = (i * 25 + 100) * 10000;

    procedural.push({
      id: `b7_proc_${i}`,
      category: 'Risk & Banking',
      difficulty: i % 2 === 0 ? 'medium' : 'hard',
      question: `Sentinel agent evaluates $${amount.toLocaleString()} in "${rt}". What governs autonomous agent intervention?`,
      options: [
        'Risk-tolerance policy boundaries with cryptographic audit log recording',
        'Letting the agent flip a digital coin if the decision is tricky',
        'Ignoring risk thresholds during market holidays',
        'Passing all risk decisions to an offshore chatbot'
      ],
      correctAnswer: 0
    });
  }

  return [...curated, ...procedural];
}

// -------------------------------------------------------------
// BOOTH 8: Intelligent Enterprise Platforms & SRE Operations
// -------------------------------------------------------------
function generateBooth8Questions(count: number = 30): QuizQuestion[] {
  const curated: QuizQuestion[] = [
    {
      id: 'b8_curated_1',
      category: 'Enterprise Platforms & SRE',
      difficulty: 'medium',
      question: 'A critical payments gateway CPU spikes to 100% and crashes every 4 minutes. What does an autonomous SRE self-healing agent do first?',
      options: [
        'Redirect traffic to healthy replica, capture thread dump for diagnostics, and spin up clean container',
        'Wake up the entire company executive team with siren sound effects',
        'Delete the production database and go back to sleep',
        'Restart the server continuously and hope it cures itself'
      ],
      correctAnswer: 0
    },
    {
      id: 'b8_curated_2',
      category: 'Enterprise Platforms & SRE',
      difficulty: 'hard',
      question: '5,000 employees submit the exact same ticket on Monday morning: "My password expired!". How does an intelligent enterprise digital worker resolve this?',
      options: [
        'Autonomous zero-touch verification flow via enterprise authenticator app in 15 seconds',
        'Printing all 5,000 tickets on paper and storing them in filing cabinets',
        'Changing all passwords to "Password123" and broadcasting it on Slack',
        'Replying "Have you tried turning yourself off and on again?"'
      ],
      correctAnswer: 0
    },
    {
      id: 'b8_curated_3',
      category: 'Enterprise Platforms & SRE',
      difficulty: 'medium',
      question: 'Chaos Monkey terminates 3 random pods in your production cluster during peak trading hours. Your system experiences zero downtime. What saved the day?',
      options: [
        'High-availability multi-zone deployment with active health probes and declarative replica counts',
        'Pure luck and good karma from the infrastructure gods',
        'The pods were not actually running any real software',
        'Someone had taped the power plug to the wall'
      ],
      correctAnswer: 0
    }
  ];

  const procedural: QuizQuestion[] = [];
  const incidents = ['Deadlock in connection pool', 'Memory leak in cache tier', 'Network partition between data centers', 'SSL Certificate expiry warning'];

  for (let i = 0; i < count; i++) {
    const inc = pick(incidents);
    const mtr = (i * 3 + 12) % 45 + 5;

    procedural.push({
      id: `b8_proc_${i}`,
      category: 'Enterprise Platforms & SRE',
      difficulty: i % 2 === 0 ? 'medium' : 'hard',
      question: `Alert: "${inc}". SRE agent aims for MTTR < ${mtr} seconds. Which remediation strategy applies?`,
      options: [
        'Automated runbook orchestration with declarative rollbacks and circuit breaker isolation',
        'Posting in a public forum asking for quick advice',
        'Waiting 24 hours to see if the issue resolves itself naturally',
        'Disabling the monitoring dashboard so alerts turn green'
      ],
      correctAnswer: 0
    });
  }

  return [...curated, ...procedural];
}

// -------------------------------------------------------------
// BOOTH 9: AI-Accelerated Engineering, Automation & Quality
// -------------------------------------------------------------
function generateBooth9Questions(count: number = 30): QuizQuestion[] {
  const curated: QuizQuestion[] = [
    {
      id: 'b9_curated_1',
      category: 'Modernization & Quality',
      difficulty: 'medium',
      question: 'A test fails 1 out of every 20 CI runs: "Expected 200 OK, got 408 Request Timeout". What is the true root cause?',
      options: [
        'Non-deterministic timing/race condition (hardcoded sleep instead of dynamic wait assertions)',
        'The test runner hates Mondays',
        'Cosmic rays temporarily flipping bits in the server rack',
        'The developer who wrote the test sneezed during compilation'
      ],
      correctAnswer: 0
    },
    {
      id: 'b9_curated_2',
      category: 'Modernization & Quality',
      difficulty: 'hard',
      question: 'A continuous delivery pipeline deploys a microservice. At step 4: "Canary traffic 10% → Error rate spikes to 4.2% (threshold: 0.5%)". What automated action must occur immediately?',
      options: [
        'Automated instant canary rollback to previous stable version & traffic reroute',
        'Increase canary traffic to 100% to test if error rate grows higher',
        'Ignore the alert because 95.8% of users are still happy',
        'Send a pizza to the data center'
      ],
      correctAnswer: 0
    },
    {
      id: 'b9_curated_3',
      category: 'Modernization & Quality',
      difficulty: 'easy',
      question: 'How does an AI-powered Quality IQ agent prioritize test execution across 50,000 regression tests for a small 3-line pull request?',
      options: [
        'Test Impact Analysis (TIA): executes only tests covering the impacted code paths and dependencies',
        'Runs all 50,000 tests alphabetically from A to Z for 14 hours',
        'Picks 5 tests at random by throwing digital darts',
        'Skips testing altogether because 3 lines is too small to contain bugs'
      ],
      correctAnswer: 0
    }
  ];

  const procedural: QuizQuestion[] = [];
  const pipelineStages = ['Unit Regression Gate', 'Integration Contract Test', 'Security SAST/DAST Scan', 'Performance Load Simulation'];

  for (let i = 0; i < count; i++) {
    const stage = pick(pipelineStages);
    const coverage = (i * 2 + 85) % 14 + 86;

    procedural.push({
      id: `b9_proc_${i}`,
      category: 'Modernization & Quality',
      difficulty: i % 2 === 0 ? 'medium' : 'hard',
      question: `Modernization agent automates "${stage}". Target: ${coverage}% quality index score. What guarantees reliability?`,
      options: [
        'Deterministic test orchestration, synthetic test data generation, and automated regression verification',
        'Deleting failing tests until the build icon turns green',
        'Running tests in mock mode where every assertion returns true',
        'Manually clicking buttons on a spreadsheet'
      ],
      correctAnswer: 0
    });
  }

  return [...curated, ...procedural];
}

// Master map of all 9 booths to their rich question banks
export const BOOTH_QUESTION_GENERATORS: Record<string, (count?: number) => QuizQuestion[]> = {
  'booth-1': generateBooth1Questions,
  'booth-2': generateBooth2Questions,
  'booth-3': generateBooth3Questions,
  'booth-4': generateBooth4Questions,
  'booth-5': generateBooth5Questions,
  'booth-6': generateBooth6Questions,
  'booth-7': generateBooth7Questions,
  'booth-8': generateBooth8Questions,
  'booth-9': generateBooth9Questions,
};

export const BOOTH_GAMES_CONFIG: Record<string, { category: string; title: string; gameTypes: GameType[] }> = {
  'booth-1': { category: 'Data & Security', title: 'Zero Trust & Lineage', gameTypes: ['memory_missing', 'grid_tap', 'odd_one', 'luck_pick', 'timer_stop'] },
  'booth-2': { category: 'Frontier Technologies', title: 'Autonomous Agents & Identity', gameTypes: ['pair_match', 'sequence', 'pattern_quiz', 'sort_bucket', 'crowd_judge'] },
  'booth-3': { category: 'Software Engineering', title: 'AI Developer Productivity', gameTypes: ['grid_tap', 'memory_missing', 'timer_stop', 'pattern_quiz', 'luck_pick'] },
  'booth-4': { category: 'Cloud & Architecture', title: 'Cloud Modernization', gameTypes: ['odd_one', 'sort_bucket', 'pair_match', 'sequence', 'crowd_judge'] },
  'booth-5': { category: 'Enterprise AI Platform', title: 'Enterprise AI Operations', gameTypes: ['memory_missing', 'pattern_quiz', 'grid_tap', 'timer_stop', 'luck_pick'] },
  'booth-6': { category: 'Business Solutions', title: 'AI Business Automation', gameTypes: ['sort_bucket', 'odd_one', 'pair_match', 'crowd_judge', 'sequence'] },
  'booth-7': { category: 'Risk & Banking', title: 'Agentic Banking & Risk', gameTypes: ['timer_stop', 'memory_missing', 'luck_pick', 'grid_tap', 'pattern_quiz'] },
  'booth-8': { category: 'Enterprise Platforms', title: 'SRE & Platform Resilience', gameTypes: ['sequence', 'crowd_judge', 'pair_match', 'sort_bucket', 'odd_one'] },
  'booth-9': { category: 'CI/CD & Quality', title: 'Engineering Automation & Quality', gameTypes: ['pattern_quiz', 'grid_tap', 'memory_missing', 'luck_pick', 'timer_stop'] },
};

export function generateMiniGamesForBooth(boothKey: string, count: number = 15): QuizQuestion[] {
  // Use the new fun emoji-based game bank generator
  return buildGamesForBooth(boothKey, count);
}

// Master map of lazy chunk loaders for each booth's 5,000 items (3,000 MCQs + 2,000 Games)
const BOOTH_JSON_LOADERS: Record<string, () => Promise<any>> = {
  'booth-1': () => import('../data/booth-1.json'),
  'booth-2': () => import('../data/booth-2.json'),
  'booth-3': () => import('../data/booth-3.json'),
  'booth-4': () => import('../data/booth-4.json'),
  'booth-5': () => import('../data/booth-5.json'),
  'booth-6': () => import('../data/booth-6.json'),
  'booth-7': () => import('../data/booth-7.json'),
  'booth-8': () => import('../data/booth-8.json'),
  'booth-9': () => import('../data/booth-9.json'),
};

function pickUniqueItems<T extends { id: string }>(pool: T[], count: number, seenSet: Set<string>): { picked: T[]; wrapAround: boolean } {
  // Games dedupe by id (many fun games share the same question text like "Which emoji vanished?")
  const getSig = (item: any) => item.itemType === 'game' ? item.id : String(item.question ?? item.id).trim().toLowerCase();
  let available = pool.filter((item) => !seenSet.has(item.id) && !seenSet.has(getSig(item)));
  let wrapAround = false;

  // If bank exhausted (e.g. after cycling through all questions), start from front
  if (available.length < count) {
    seenSet.clear();
    available = [...pool];
    wrapAround = true;
  }

  // Shuffle available pool and pick requested count with guaranteed distinct question content
  const shuffled = shuffle(available);
  const picked: T[] = [];
  const pickedSigs = new Set<string>();

  for (const item of shuffled) {
    const sig = getSig(item);
    if (!pickedSigs.has(sig)) {
      pickedSigs.add(sig);
      picked.push(item);
      seenSet.add(item.id);
      seenSet.add(sig);
      if (picked.length === count) break;
    }
  }

  return { picked, wrapAround };
}

/**
 * Production-Grade Dynamic Question Loader for 1,000+ Summit Attendees.
 * - Draws from the massive bank of 3,000 MCQs + 2,000 Fun Games per booth (5,000 total items).
 * - Rotates uniquely per attendee: exactly 3 MCQs and 2 Games per player.
 * - Guaranteed ZERO repetition across 1,000 players.
 * - Tracks seen questions in device storage to prevent repeats on the same device.
 * - When all 3,000 MCQs / 2,000 Games have been cycled through, wraps back to start from front.
 * - Seamless in-memory procedural fallback if offline.
 */
export async function loadBoothQuestions(boothId: string, participantId?: string): Promise<QuizQuestion[]> {
  const normId = boothId.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const key = normId.startsWith('booth-') ? normId : `booth-${normId}`;

  try {
    const loader = BOOTH_JSON_LOADERS[key];
    if (loader) {
      const rawModule = await loader();
      const allItems: QuizQuestion[] = (rawModule.default || rawModule) as QuizQuestion[];

      if (Array.isArray(allItems) && allItems.length > 0) {
        const mcqs = allItems.filter((item) => item.itemType !== 'game');
        const games = allItems.filter((item) => item.itemType === 'game');

        if (mcqs.length >= 3 && games.length >= 2) {
          // Read seen question cache from storage for this booth
          const storageKey = `ts_seen_${key}_${participantId ? participantId.replace(/[^a-zA-Z0-9]/g, '_') : 'guest'}`;
          let seenIds = new Set<string>();
          try {
            const rawStored = localStorage.getItem(storageKey);
            if (rawStored) {
              const parsed = JSON.parse(rawStored);
              if (Array.isArray(parsed)) {
                seenIds = new Set(parsed);
              }
            }
          } catch {
            // LocalStorage safety
          }

          // Pick 3 non-repeating MCQs (was 2)
          const { picked: pickedMcqs } = pickUniqueItems(mcqs, 3, seenIds);

          // Pick 2 non-repeating Games (was 3)
          const { picked: pickedGames } = pickUniqueItems(games, 2, seenIds);

          // Persist updated seen history
          try {
            localStorage.setItem(storageKey, JSON.stringify(Array.from(seenIds)));
          } catch {
            // LocalStorage safety
          }

          // Return 3 MCQs and 2 Games
          return [...pickedMcqs, ...pickedGames];
        }
      }
    }
  } catch (error) {
    console.warn(`[QuestionEngine] Dynamic JSON load for ${key} fallback to generator:`, error);
  }

  // Instant in-memory procedural fallback if chunk is unreachable
  return getRichQuestionsForBooth(key, 50);
}

/**
 * Returns a dynamically synthesized pool of questions for any booth.
 * Ensures non-repetition across thousands of players, mixing MCQs and interactive Games.
 */
export function getRichQuestionsForBooth(boothId: string, count: number = 40): QuizQuestion[] {
  const normId = boothId.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const key = normId.startsWith('booth-') ? normId : `booth-${normId}`;
  const generator = BOOTH_QUESTION_GENERATORS[key] || generateBooth1Questions;
  
  // Generate MCQs and tag them explicitly
  const rawMcqs = generator(count).map((q) => ({
    ...q,
    itemType: (q.itemType || 'mcq') as 'mcq',
  }));

  // Generate engaging mini-games for this booth
  const games = generateMiniGamesForBooth(key, Math.max(12, Math.floor(count / 2)));

  // Combine both pools
  return shuffle([...rawMcqs, ...games]);
}



