const fs = require('fs');
const path = require('path');

// Helper to pick random item from array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[j], c[i]] = [c[i], c[j]];
  }
  return c;
}

const COMMON_COMEDY_DISTRACTORS = [
  'Restart the microservice repeatedly until it feels refreshed and decides to work 😴',
  'Unplug the datacenter Ethernet cable, blow on it for good luck, and plug it back in 🔌',
  'Ask the junior engineer to keep pressing F5 continuously until morale improves ☕',
  'Delete all failing test cases so the CI/CD pipeline turns a calming shade of green 🟢',
  'Blame cosmic radiation for temporarily inverting bits on node-42 in the cluster 🪐',
  'File a ticket with the helpdesk asking "Why is the cloud raining errors?" 🌧️',
  'Disable authentication completely so network packets can travel with maximum freedom 🕊️',
  'Rename the software bug to "Advanced Undocumented Surprise Feature" in release notes 🏆',
  'Switch all database queries to synchronous blocking while-true loops for suspense ⏳',
  'Print all 50,000 log lines on cardstock paper and file them alphabetically in cabinets 🗄️',
  'Whisper sweet motivational affirmations into the server fan exhaust vent 🗣️',
  'Set all timeout values to 999999 seconds so requests can contemplate the meaning of life 🌌'
];

// Definition of 9 Booth Archetypes
const BOOTH_SPECS = [
  // BOOTH 1
  {
    num: 1,
    id: 'booth-1',
    category: 'Data & Security',
    title: 'Data Governance, Lineage & Zero Trust',
    systems: ['Credit-Vault', 'Sentinel-PII', 'Data-Mesh-Alpha', 'Audit-Ledger-X', 'Identity-Broker', 'Lakehouse-Bronze'],
    scenarios: [
      {
        tag: 'ZERO-TRUST ENCLAVE',
        prompt: (sys, num) => `Service "${sys}" is establishing an inter-zone connection with ${num} microservices. 3 are authentic Zero Trust controls. Which one is an undercover security hazard?`,
        correct: 'Relying exclusively on the internal network perimeter firewall and assuming all internal LAN traffic is friendly ☕',
        plausible: [
          'Enforcing mutual TLS (mTLS) with cryptographically verifiable SPIFFE x509 SVIDs',
          'Validating ephemeral claims on short-lived JWT tokens on every individual request',
          'Continuous behavioral anomaly evaluation and instant session quarantine'
        ]
      },
      {
        tag: 'DATA LINEAGE PUZZLE',
        prompt: (sys, num) => `An automated GDPR "Right to be Forgotten" erasure request arrives for User #${num * 317}. Pipeline flow is: Raw SFTP Ingestion ➡️ ${sys} ➡️ Feature Store ➡️ Inference Model. Where must the deletion and lineage audit propagate?`,
        correct: 'End-to-end across all upstream staging buckets, the feature store, cache layers, and downstream training metadata',
        plausible: [
          'Only in the final inference model output database table',
          'Nowhere, since data older than 24 hours automatically ceases to exist legally',
          'Only in the browser local storage of the customer support agent'
        ]
      },
      {
        tag: 'INCIDENT LOG SLEUTH',
        prompt: (sys, num) => `Review this captured log line on ${sys}:\n\`POST /api/v1/auth/token - payload: {"user": "admin\' OR \'${num}\'=\'${num}", "hash": "--"}\`\nWhat attack was blocked by the input sanitizer?`,
        correct: 'SQL Injection targeting backend relational authentication queries',
        plausible: [
          'Cross-Site Request Forgery (CSRF)',
          'Server-Side Template Injection (SSTI)',
          'XML External Entity (XXE) expansion'
        ]
      },
      {
        tag: 'KEY ROTATION MATH',
        prompt: (sys, num) => `The KMS key on ${sys} rotates every ${num} days. Envelope encryption uses a Data Encryption Key (DEK) cached for at most 60 minutes. If the Key Encryption Key (KEK) is compromised, what is the blast radius?`,
        correct: 'All historical ciphertexts encrypted under that specific KEK version must be re-wrapped immediately',
        plausible: [
          'Zero blast radius because KMS keys are immune to human error',
          'Only files created in the last 60 minutes need attention',
          'The entire cloud provider datacenter must be physically demolished'
        ]
      },
      {
        tag: 'VULNERABILITY SCANNER',
        prompt: (sys, num) => `A static vulnerability scanner flags CVE-2026-${num * 11} (CVSS score: 9.8) in base image for ${sys}. What is the mandatory DevSecOps remediation gate?`,
        correct: 'Block pipeline promotion, rebuild from patched minimal base image, and verify with SBOM artifact signing',
        plausible: [
          'Downgrade the CVSS score to 2.1 in the scanner configuration to allow deployment',
          'Deploy anyway because 9.8 is an almost perfect score',
          'Wait 6 months until the CVE enters retirement'
        ]
      }
    ]
  },

  // BOOTH 2
  {
    num: 2,
    id: 'booth-2',
    category: 'Frontier Technologies',
    title: 'Autonomous Agents & Digital Identity',
    systems: ['Agent-Argus', 'MCP-Router', 'DID-Resolver-Node', 'Autonomy-Mesh', 'Persona-Engine', 'Cognitive-Bus'],
    scenarios: [
      {
        tag: 'AGENT RUNAWAY LOOP',
        prompt: (sys, num) => `Agent "${sys}" is collaborating with Agent-Beta to reconcile $${num * 250}. Agent Alpha says "Please confirm". Beta says "Please re-confirm". This ping-pong loop has repeated ${num + 20} times. How is it prevented?`,
        correct: 'Orchestrator recursion depth ceiling, cycle detection hash, and human-in-the-loop intervention gates',
        plausible: [
          'Letting the agents chat indefinitely until they run out of electrical power',
          'Increasing the token limit to 10 million so they have plenty of room to argue',
          'Instructing the LLM with "Please stop being so overly polite in replies"'
        ]
      },
      {
        tag: 'TOKEN MATH PUZZLE',
        prompt: (sys, num) => `${sys} has a context window of ${num * 1024} tokens. System instructions occupy 512 tokens. Each tool execution adds 256 tokens of input and 128 tokens of output. After 8 tool steps, how much context headroom remains?`,
        correct: (sys, num) => `${num * 1024 - 512 - (8 * 384)} tokens available for reasoning and user response`,
        plausible: [
          '0 tokens (the model hallucinates that it is out of memory)',
          (sys, num) => `${num * 1024} tokens because tokens automatically evaporate when finished`,
          'Exactly 100 tokens regardless of math'
        ]
      },
      {
        tag: 'MCP TOOL SAFETY',
        prompt: (sys, num) => `In the Model Context Protocol (MCP), what cryptographic or authorization mechanism prevents ${sys} from invoking unauthorized external shell commands?`,
        correct: 'Strict JSON-RPC schema contracts, capability negotiation, and scoped permission manifests per tool server',
        plausible: [
          'Hoping the AI agent reads the terms and conditions and respects them',
          'Running the shell script as root so errors are completely suppressed',
          'Only allowing agents to execute tools on odd-numbered days'
        ]
      },
      {
        tag: 'DIGITAL IDENTITY ZKP',
        prompt: (sys, num) => `Customer #${num * 88} presents a W3C Verifiable Credential to prove they are over 21 without revealing their exact birth date or home address. How does the DID verifier authenticate this?`,
        correct: 'Validates cryptographic ZKP predicate and checks issuer digital signature against decentralized registry',
        plausible: [
          'Asks the customer to take a selfie holding today\'s physical newspaper',
          'Downloads their entire credit bureau history and reads it manually',
          'Accepts an unencrypted screenshot saved in MS Paint'
        ]
      },
      {
        tag: 'MULTI-AGENT DEBATE',
        prompt: (sys, num) => `A multi-agent committee (Risk Agent, Fraud Agent, Approval Agent) evaluates transaction #${num * 999}. 2 agents approve and 1 agent flags severe anomaly. What is the correct orchestrator behavior?`,
        correct: 'Route to asynchronous human exception review queue under strict governance SLA',
        plausible: [
          'Mute the dissenting agent because majority always rules without question',
          'Average the credit score by dividing by zero',
          'Approve the transaction immediately and blame the algorithm later'
        ]
      }
    ]
  },

  // BOOTH 3
  {
    num: 3,
    id: 'booth-3',
    category: 'Software Engineering',
    title: 'AI-Powered Software Engineering & Developer Productivity',
    systems: ['Copilot-Gate', 'SDLC-Synthesizer', 'Prompt2Prod-Node', 'Mutation-Engine', 'Quality-Matrix', 'Code-Modernizer'],
    scenarios: [
      {
        tag: 'PROMPT-TO-PROD AUDIT',
        prompt: (sys, num) => `An AI assistant writes a ${num * 15}-line microservice endpoint with direct SQL execution. What automated check MUST run before permitting pull request merge?`,
        correct: 'Automated SAST scanning for parameterized queries, container vulnerability checks, and mutation test verification',
        plausible: [
          'Committing straight to main branch on Friday at 4:59 PM with message "it compiled fine on my laptop" 🏃‍♂️',
          'Skipping code review because AI has an estimated IQ higher than the team lead',
          'Deleting unit tests because they slow down delivery velocity metrics'
        ]
      },
      {
        tag: 'PHANTOM COVERAGE DETECTIVE',
        prompt: (sys, num) => `The CI pipeline on ${sys} reports: "Lines of code: ${num * 1000} | Statement Coverage: 97% | Mutation Score: 4%". What critical flaw exists in this test suite?`,
        correct: 'Tests are executing code paths without assertions (Phantom Coverage), failing to catch real logic mutations',
        plausible: [
          'The code is so high-quality that mutants refuse to live in it',
          'The test runner is running backwards in time',
          '97% coverage guarantees mathematically zero defects forever'
        ]
      },
      {
        tag: 'CONCURRENCY SLEUTH',
        prompt: (sys, num) => `Review this generated TypeScript snippet:\n\`let balance = ${num * 50};\nasync function deduct() { balance = balance - 10; }\`\nWhat bug will occur under ${num * 20} concurrent requests?`,
        correct: 'Race condition due to non-atomic read-modify-write without mutex or transactional isolation',
        plausible: [
          'Syntax error because variables cannot contain numbers',
          'The server will run out of hard drive space',
          'TypeScript compiler will self-destruct'
        ]
      },
      {
        tag: 'MODERNIZATION ACCELERATOR',
        prompt: (sys, num) => `${sys} is translating ${num * 2500} lines of legacy procedural COBOL/Java into modern cloud services. What ensures semantic equivalence?`,
        correct: 'Differential fuzz testing and behavioral parity assertion suites executed against legacy output baselines',
        plausible: [
          'Eyeballing the code and asking if everyone feels good about it',
          'Changing file extensions from .cbl to .ts and running it',
          'Relying entirely on the AI model\'s self-reported confidence score'
        ]
      }
    ]
  },

  // BOOTH 4
  {
    num: 4,
    id: 'booth-4',
    category: 'Cloud & Architecture',
    title: 'Cloud Modernization & Data Platforms',
    systems: ['Lakehouse-Iceberg', 'Kafka-Mesh-7', 'Strangler-Facade', 'Modern-ETL-X', 'Cloud-Decomp-Core', 'K8s-Scaler'],
    scenarios: [
      {
        tag: 'STRANGLER FIG STRATEGY',
        prompt: (sys, num) => `When decomposing a 20-year-old core processing monolith servicing ${num * 50000} daily transactions, how does ${sys} prevent distributed catastrophic downtime?`,
        correct: 'Strangler Fig facade intercepting and routing incremental domain slices to microservices behind a circuit breaker',
        plausible: [
          'The "Big Bang" shutdown: turn off the legacy mainframe over the weekend and hope for the best 💥',
          'Copying the entire monolith into a single AWS Lambda function with a 15-minute timeout',
          'Renaming the monolithic .war file to .cloud-native and redeploying'
        ]
      },
      {
        tag: 'ELT VS ETL TIMING',
        prompt: (sys, num) => `Why do modern Lakehouses on ${sys} prioritize Extract-Load-Transform (ELT) over traditional Extract-Transform-Load (ETL) when processing ${num * 10} TBs?`,
        correct: 'Raw data is immutably landed first in elastic cloud object storage, leveraging distributed compute for decoupled on-demand transformations',
        plausible: [
          'Because the letter L looks better between E and T in architecture diagrams',
          'Databases forgot how to calculate transformations in memory',
          'Cloud storage is so expensive that transforming before storing is forbidden'
        ]
      },
      {
        tag: 'AUTOSCALING DISASTER',
        prompt: (sys, num) => `A Kubernetes cluster autoscaler on ${sys} spawned ${num * 50} compute nodes over Saturday night due to an unhandled retry storm. What safeguard stops this?`,
        correct: 'Strict cluster resource limits, maxNode boundaries, pod disruption budgets, and budget anomaly alerts',
        plausible: [
          'Call the cloud provider and claim the servers were launched by aliens',
          'Keep all nodes running because warm servers keep the datacenter cozy',
          'Delete the cloud billing account to erase the charges'
        ]
      },
      {
        tag: 'IDEMPOTENCY GUARANTEE',
        prompt: (sys, num) => `A network glitch causes a Kafka producer on ${sys} to retry sending payment batch #${num * 1234} three times. What ensures customers are charged exactly once?`,
        correct: 'Idempotent consumer processing with unique deduplication keys and transactional database writes',
        plausible: [
          'Trusting the network never drops packets on weekdays',
          'Charging the customer 3 times and sending them 2 apology greeting cards',
          'Turning off the Kafka broker when retries appear'
        ]
      }
    ]
  },

  // BOOTH 5
  {
    num: 5,
    id: 'booth-5',
    category: 'Enterprise AI Platform',
    title: 'Enterprise AI Platform & Intelligent AI Operations',
    systems: ['Model-Router-X', 'FinOps-Guardian', 'MLOps-Canary', 'Tachyon-Core', 'Inference-Optimizer', 'Edge-Runtime-Node'],
    scenarios: [
      {
        tag: 'SMART MODEL ROUTING',
        prompt: (sys, num) => `An incoming query asks: "Calculate ${num * 13} * 7.5". Your platform has a 405B Frontier LLM ($$$) and an embedded deterministic math evaluator (<1ms, $0). Where does ${sys} route?`,
        correct: 'Routes to the deterministic math engine, saving 99.9% cost and delivering sub-millisecond response time',
        plausible: [
          'Routes to the 405B model because bigger models do multiplication with more emotional depth 🎭',
          'Queries both models 10 times and calculates an average of their numbers',
          'Rejects the request because math is too boring for artificial intelligence'
        ]
      },
      {
        tag: 'CONCEPT DRIFT DETECTIVE',
        prompt: (sys, num) => `A credit risk model deployed on ${sys} showed 94% accuracy in 2024. In 2026, without code changes, accuracy drops to ${num + 55}%. What occurred?`,
        correct: 'Data & Concept Drift: macroeconomic factors and consumer behavior shifted, causing training distributions to mismatch live reality',
        plausible: [
          'The AI model weights got tired from calculating too many numbers',
          'Bit rot occurred in the GPU silicon memory chips',
          'Python 3.12 made mathematical division more forgiving'
        ]
      },
      {
        tag: 'FINOPS SURPRISE',
        prompt: (sys, num) => `A rogue loop in an integration script consumed ${num * 100000} tokens in 30 minutes, burning thousands of dollars. What enterprise platform control stops this?`,
        correct: 'Multi-tenant rate limiters, token quota caps, cost anomaly tripwires, and automated request throttling',
        plausible: [
          'Ask the AI provider for a refund because the prompt was typed accidentally',
          'Read all generated tokens aloud so the company gets its money\'s worth',
          'Hide the credit card bill before the CFO walks past your desk'
        ]
      },
      {
        tag: 'SPECULATIVE DECODING',
        prompt: (sys, num) => `How does speculative decoding in ${sys} speed up large 70B parameter LLM inference by ${num * 2}% without degrading output quality?`,
        correct: 'A small draft model speculatively generates token candidates which are verified in parallel by the target model in a single forward pass',
        plausible: [
          'It skips every second word in the output sentences to save time',
          'It runs the GPU fan in reverse to suck in more electricity',
          'It guesses random words and changes them if the user complains'
        ]
      }
    ]
  },

  // BOOTH 6
  {
    num: 6,
    id: 'booth-6',
    category: 'Business Solutions',
    title: 'AI Business Intelligence & Process Automation',
    systems: ['RAG-Extractor-6', 'Docu-AI-Parser', 'Fraud-Sentinel', 'Process-Flow-Agent', 'Insight-Synthesizer', 'Decision-Matrix'],
    scenarios: [
      {
        tag: 'PDF EXTRACTION CHALLENGE',
        prompt: (sys, num) => `A commercial loan prospectus is ${num * 100} pages long. When a user asks: "What is the liability cap in section ${num % 20 + 1}?", what architecture guarantees a correct, non-hallucinated response?`,
        correct: 'Hybrid RAG combining semantic chunking, dense vector embeddings, BM25 keyword matching, and cross-encoder re-ranking',
        plausible: [
          'Stuffing all 500 pages into a prompt and hoping the context window doesn\'t choke',
          'Asking an intern to speed-read the document into the laptop microphone',
          'Summarizing the entire document into "It is about money" and closing the tab'
        ]
      },
      {
        tag: 'SPOT THE HALLUCINATION',
        prompt: (sys, num) => `An automated marketing assistant on ${sys} drafts: "Guaranteed ${num * 12}% monthly returns risk-free on standard checking accounts!". Why is this immediately flagged?`,
        correct: 'Severe financial hallucination violating consumer protection and truth-in-savings legal requirements',
        plausible: [
          'The email draft did not use Times New Roman font',
          '12% monthly return is too modest for modern tech startups',
          'The draft lacked sufficient rocket ship emojis 🚀'
        ]
      },
      {
        tag: 'FRAUD DETECTION GRAPH',
        prompt: (sys, num) => `A suspicious buyer account on ${sys} conducts ${num * 5} small purchases across 10 cards within 45 seconds. How does the fraud analytics agent detect this ring?`,
        correct: 'Real-time graph intelligence linking device fingerprints, shared IP subnets, velocity thresholds, and entity resolution',
        plausible: [
          'Sends a postcard to each cardholder asking if they are shopping right now',
          'Assumes the buyer is just buying holiday gifts very enthusiastically',
          'Flips a coin: heads is legitimate, tails is fraud'
        ]
      },
      {
        tag: 'AUTOMATION ROI REALITY',
        prompt: (sys, num) => `${sys} automates ${num * 500} hours of manual spreadsheet data reconciliation per month. What is the highest-value reallocation of analyst capacity?`,
        correct: 'Investigating complex anomalies, root-cause exceptions, and strategic business advisory workflows',
        plausible: [
          'Creating even larger spreadsheets with 45 nested VLOOKUP formulas that crash Excel',
          'Staring out the window contemplating the digital singularity',
          'Typing random numbers into Notepad to keep muscle memory active'
        ]
      }
    ]
  },

  // BOOTH 7
  {
    num: 7,
    id: 'booth-7',
    category: 'Risk & Banking',
    title: 'Agentic Banking, Risk Intelligence & AI Teammates',
    systems: ['Adverse-News-NLP', 'Credit-Sentinel', 'Wire-Guard-Agent', 'Underwrite-AI', 'Risk-Orchestrator', 'Market-Watcher'],
    scenarios: [
      {
        tag: 'ADVERSE NEWS SENTINEL',
        prompt: (sys, num) => `An adverse news NLP agent on ${sys} detects: "Supplier Apex Corp CFO abruptly resigns amidst audit investigation". Exposure is $${num * 500000}. What immediate action executes?`,
        correct: 'Recalculates counterparty risk score, freezes uncommitted credit lines, and dispatches automated alert to credit officers',
        plausible: [
          'Buys more stock in Apex Corp because corporate drama is entertaining',
          'Mutes news alerts until after the Monday morning coffee break',
          'Posts a funny reaction GIF in the company team chat'
        ]
      },
      {
        tag: 'WIRE ANOMALY CHALLENGE',
        prompt: (sys, num) => `A wire transfer of $${num * 25000} is initiated at 03:22 AM from a new browser fingerprint in a high-risk jurisdiction. How does ${sys} respond?`,
        correct: 'Automated transaction hold, step-up multi-factor biometric authentication challenge, and risk queue escalation',
        plausible: [
          'Approves instantly because sending money at 3:00 AM shows remarkable dedication',
          'Sends an email asking "Is this really you, or are you a mischievous hacker?"',
          'Converts the money into digital tokens and hides it in a spreadsheet'
        ]
      },
      {
        tag: 'EXPLAINABLE AI MANDATE',
        prompt: (sys, num) => `An automated underwriting assistant on ${sys} recommends denying mortgage application #${num * 777}. Under fair lending regulations, what must the model provide?`,
        correct: 'Clear adverse action notices detailing principal key reason codes (e.g. debt-to-income ratio, credit history depth)',
        plausible: [
          'A cryptic message saying "The machine learning algorithm has spoken, do not question it"',
          'A printout of model matrix multiplication tensor weights',
          'An apology note expressing regret about the applicant\'s credit score'
        ]
      },
      {
        tag: 'STRESS TEST MONTE CARLO',
        prompt: (sys, num) => `${sys} simulates a ${num * 50} basis point interest rate shock across ${num * 10000} commercial portfolios. What metric determines balance sheet resilience?`,
        correct: 'Common Equity Tier 1 (CET1) capital adequacy ratio and Liquidity Coverage Ratio (LCR) under stressed cash flow outflows',
        plausible: [
          'The total number of paper checks sitting in the bank vault',
          'The average smile rating of branch tellers on Google Reviews',
          'Whether the bank\'s logo colors match the current season'
        ]
      }
    ]
  },

  // BOOTH 8
  {
    num: 8,
    id: 'booth-8',
    category: 'Enterprise Platforms',
    title: 'Intelligent Enterprise Platforms & SRE Operations',
    systems: ['Self-Heal-SRE', 'Service-Desk-Bot', 'Chaos-Monkey-Agent', 'Infra-Mesh-8', 'Telemetry-Collector', 'SLA-Monitor'],
    scenarios: [
      {
        tag: '03:00 AM ON-CALL OUTAGE',
        prompt: (sys, num) => `A high-throughput API gateway on ${sys} experiences CPU saturation (99.8%) and thread lock every ${num % 10 + 2} minutes. How does the autonomous SRE agent remediate in <30 seconds?`,
        correct: 'Reroutes traffic to healthy warm standby cluster, captures thread/heap dump for diagnostics, and triggers canary pod rolling restarts',
        plausible: [
          'Sends an automated pager alert to all 5,000 employees in the corporate directory',
          'Power-cycles the entire physical server rack while screaming in lowercase',
          'Deletes all server logs so the monitoring graph looks clean and calm'
        ]
      },
      {
        tag: 'SERVICE DESK RESET TSUNAMI',
        prompt: (sys, num) => `Following an enterprise security policy update, ${num * 250} employees submit password lock tickets simultaneously on ${sys}. How does the digital worker handle this?`,
        correct: 'Zero-touch automated identity verification via enterprise authenticator push token and self-service credential issuance in <15s',
        plausible: [
          'Prints all tickets and assigns them to the IT intern as a character-building exercise',
          'Sets everyone\'s password to "Password123" and posts it on the company intranet',
          'Replies to all tickets with: "Have you tried restarting your life?"'
        ]
      },
      {
        tag: 'CHAOS EXPERIMENT SURVIVAL',
        prompt: (sys, num) => `A chaos experiment terminates ${num % 4 + 2} primary database replicas in zone us-east-1 during peak market hours. Why does ${sys} achieve zero customer transaction loss?`,
        correct: 'Multi-AZ synchronous replication with automated Raft consensus leader election and transparent connection pool failover',
        plausible: [
          'The database was not actually doing any real work during market hours',
          'Pure luck, good astrological alignment, and crossing fingers tightly',
          'The chaos monkey got confused and terminated its own container'
        ]
      },
      {
        tag: 'OBSERVABILITY CORRELATION',
        prompt: (sys, num) => `A microservice on ${sys} experiences a latency spike from 45ms to ${num * 150}ms. Which telemetry triangulation identifies the root cause fastest?`,
        correct: 'Distributed trace spans correlated with backend database query lock duration and container cgroup CPU throttling metrics',
        plausible: [
          'Reading every single syslog message from top to bottom on the terminal',
          'Asking the developers if anyone committed code while feeling grumpy',
          'Checking the weather forecast near the cloud datacenter'
        ]
      }
    ]
  },

  // BOOTH 9
  {
    num: 9,
    id: 'booth-9',
    category: 'CI/CD & Quality',
    title: 'AI-Accelerated Engineering, Automation & Quality',
    systems: ['CI-Accelerator', 'Test-Impact-IQ', 'Canary-Watcher', 'Contract-Pact-Node', 'Modernize-Pipe', 'Code-Doctor-AI'],
    scenarios: [
      {
        tag: 'FLAKY TEST DETECTIVE',
        prompt: (sys, num) => `A test in ${sys} fails 1 out of every ${num % 20 + 10} CI runs with "AssertionError: Expected 200 OK, got 408 Request Timeout". What is the true root cause?`,
        correct: 'Non-deterministic race condition or hardcoded timing sleep instead of dynamic condition-polling assertions',
        plausible: [
          'The test runner holds a grudge against the author of the pull request',
          'The server needs to be taken out for a nice walk in the park',
          'The test passed in spirit, so it should be counted as green anyway'
        ]
      },
      {
        tag: 'CANARY ROLLBACK REFLEX',
        prompt: (sys, num) => `Deploying service v${num % 5 + 2}.0 on ${sys}. At 10% canary traffic, error rate climbs to ${num % 3 + 4}.1% (SLA threshold: 0.5%). What automated pipeline action executes?`,
        correct: 'Instant automated canary abort, traffic rollback to previous stable deployment, and notification dispatch with error trace',
        plausible: [
          'Increase canary traffic to 100% to see if errors fix themselves at higher volume 📈',
          'Mute the alert because 95% of users are still receiving responses anyway',
          'Blame the client\'s internet service provider and mark deploy successful'
        ]
      },
      {
        tag: 'TEST IMPACT ACCELERATION',
        prompt: (sys, num) => `A pull request touches only 4 lines of code in ${sys}. The full regression suite has ${num * 1000} tests taking 6 hours. How does AI Quality IQ optimize this?`,
        correct: 'Executes only the precise subset of unit and integration tests mapped to the modified AST code paths and dependencies in <2 minutes',
        plausible: [
          'Runs all tests alphabetically and stops when the developer gets tired of waiting',
          'Skips tests entirely because 4 lines of code cannot possibly contain bugs',
          'Picks 3 random tests by throwing virtual darts at the monitor'
        ]
      },
      {
        tag: 'CONTRACT TESTING DEFENSE',
        prompt: (sys, num) => `An upstream service changes field \`accountId\` from integer to UUID string without notifying downstream on ${sys}. What CI gate catches this before production?`,
        correct: 'Consumer-Driven Contract Testing (Pact) failing the PR verification build due to breaking schema mismatch',
        plausible: [
          'Waiting until customers complain on social media after the deployment',
          'Hoping JavaScript\'s type coercion miraculously figures out what to do',
          'Checking if the JSON file size is a multiple of 8 bytes'
        ]
      }
    ]
  }
];

// 30 Diverse Production Code Review Templates for Interactive Mini-Games
const CODE_REVIEW_TEMPLATES = [
  {
    topic: 'File System & Ingestion Security',
    build: (sys, num) => ({
      title: `${sys} Ingestion Worker`,
      lines: [
        `const payload = await sftpStream.readChunk();`,
        `const sanitized = scrubPIIFields(payload);`,
        `if (sanitized.length > 0) fs.rmSync("/", { recursive: true }); // delete temp files 💣`,
        `await elasticClient.bulkIndex(sanitized);`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 attempts to recursively delete the entire server root directory instead of a temp directory!',
    }),
  },
  {
    topic: 'Authentication & Privilege Escalation',
    build: (sys, num) => ({
      title: `${sys} Microservice Gate`,
      lines: [
        `const token = await authService.verify(req.headers.authorization);`,
        `if (!token) throw new AuthError("Missing bearer token");`,
        `if (token.role === "guest") token.role = "superuser"; // temporary override for demo 💣`,
        `return handleDataProcessing(req.body);`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 quietly promotes unauthenticated guest accounts to full superuser privileges!',
    }),
  },
  {
    topic: 'Financial Transaction Calculation',
    build: (sys, num) => ({
      title: `${sys} Payment Settlement Engine`,
      lines: [
        `const rate = await currencyBroker.fetchExchangeRate("USD", "INR");`,
        `const finalDebit = transaction.amount * rate;`,
        `if (finalDebit > 1000) transaction.discount = 1.0; // 100% discount promotion 💸`,
        `await ledger.recordDebit(finalDebit * (1 - transaction.discount));`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 awards a 100% discount waiver on massive enterprise wire transfers!',
    }),
  },
  {
    topic: 'Relational Database SQL Injection',
    build: (sys, num) => ({
      title: `${sys} Account Query Handler`,
      lines: [
        `const { accountId, searchFilter } = req.query;`,
        `const query = \`SELECT * FROM ledger WHERE id = '\${accountId}' AND note LIKE '%\${searchFilter}%'\`;`,
        `const rows = await dbPool.rawExecute(query);`,
        `return res.json({ status: "success", data: rows });`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 concatenates unescaped user query parameters directly into raw SQL query!',
    }),
  },
  {
    topic: 'Transaction ACID Commit Concurrency',
    build: (sys, num) => ({
      title: `${sys} Balance Transfer Coordinator`,
      lines: [
        `const tx = await dbClient.beginTransaction();`,
        `await tx.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amt, fromId]);`,
        `tx.commit(); // fire-and-forget transaction commit without awaiting 💣`,
        `return res.status(200).send({ message: "Transfer queued" });`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 fails to await tx.commit(), risking silent rollbacks and orphaned state!',
    }),
  },
  {
    topic: 'Unbounded Memory Leak & OOM',
    build: (sys, num) => ({
      title: `${sys} Telemetry Ingestion Collector`,
      lines: [
        `const metricsBuffer = []; // global module-level cache`,
        `export function trackRequest(req) {`,
        `  metricsBuffer.push(req); // retains entire request socket objects indefinitely 💣`,
        `  if (metricsBuffer.length > 0) metricsLogger.flush(); }`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 pushes whole request objects into an unbounded array, causing Node.js heap OOM crash!',
    }),
  },
  {
    topic: 'ReDoS Catastrophic Backtracking',
    build: (sys, num) => ({
      title: `${sys} Email Validator Middleware`,
      lines: [
        `const userEmail = req.body.email || "";`,
        `const emailRegex = /^([a-zA-Z0-9]+)*@([a-zA-Z0-9]+)*\\.[a-z]+$/; // nested catastrophic quantifiers 💣`,
        `if (!emailRegex.test(userEmail)) return res.status(400).send("Invalid email");`,
        `return handleUserRegistration(userEmail);`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 uses nested regex quantifiers vulnerable to catastrophic polynomial backtracking (ReDoS)!',
    }),
  },
  {
    topic: 'PII & PCI-DSS Plaintext Exposure',
    build: (sys, num) => ({
      title: `${sys} Card Tokenizer Service`,
      lines: [
        `const payload = decryptCardPayload(req.body.encrypted);`,
        `logger.info("Payment processing started", { pan: payload.creditCardNumber, cvv: payload.cvv }); // PII leak 💣`,
        `const token = await paymentGateway.tokenize(payload);`,
        `return res.json({ token, status: "tokenized" });`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 logs unencrypted primary account numbers (PAN) and CVV codes in plaintext!',
    }),
  },
  {
    topic: 'Database Connection Pool Starvation',
    build: (sys, num) => ({
      title: `${sys} High-Throughput Order Service`,
      lines: [
        `const client = await pool.connect();`,
        `try {`,
        `  return await client.query("SELECT * FROM high_volume_orders"); // returns without releasing client 💣`,
        `} catch (e) { client.release(); throw e; }`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 returns query results without calling client.release(), starving the connection pool!',
    }),
  },
  {
    topic: 'Boundary Condition Off-By-One',
    build: (sys, num) => ({
      title: `${sys} Partition Dispatcher`,
      lines: [
        `const partitions = await kafka.getPartitions("telemetry-feed");`,
        `for (let i = 0; i <= partitions.length; i++) { // off-by-one out of bounds error 💣`,
        `  const worker = spawnPartitionWorker(partitions[i].id);`,
        `  worker.start(); }`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 iterates with i <= length, throwing TypeError accessing undefined index on last loop!',
    }),
  },
  {
    topic: 'Hardcoded Cryptographic Secret',
    build: (sys, num) => ({
      title: `${sys} JWT Token Verifier`,
      lines: [
        `const token = req.headers["x-access-token"];`,
        `const JWT_SECRET = "production_super_secret_master_key_do_not_leak_12345"; // hardcoded secret 💣`,
        `const decoded = jwt.verify(token, JWT_SECRET);`,
        `return next();`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 hardcodes production cryptographic secrets directly in source control!',
    }),
  },
  {
    topic: 'Event Loop Blocking Thread Freeze',
    build: (sys, num) => ({
      title: `${sys} Webhook Ingress Gateway`,
      lines: [
        `export async function handleWebhook(payload) {`,
        `  const waitUntil = Date.now() + 5000; while (Date.now() < waitUntil) {} // blocks Node event loop for 5s 💣`,
        `  await forwardPayloadToQueue(payload);`,
        `  return { acknowledged: true }; }`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 runs a synchronous while-loop that freezes the entire single-threaded Node.js event loop!',
    }),
  },
  {
    topic: 'CORS Wildcard with Credentials',
    build: (sys, num) => ({
      title: `${sys} Public REST API Endpoint`,
      lines: [
        `app.use((req, res, next) => {`,
        `  res.setHeader("Access-Control-Allow-Origin", "*");`,
        `  res.setHeader("Access-Control-Allow-Credentials", "true"); // illegal browser wildcard with credentials 💣`,
        `  next(); });`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 combines Allow-Origin: * with Allow-Credentials: true, rejected by modern browsers!',
    }),
  },
  {
    topic: 'Insecure Direct Object Reference (IDOR)',
    build: (sys, num) => ({
      title: `${sys} Invoice Download Controller`,
      lines: [
        `app.get("/api/v1/invoices/:id", async (req, res) => {`,
        `  const invoice = await db.invoices.findById(req.params.id); // missing tenantId / userId ownership check 💣`,
        `  if (!invoice) return res.status(404).send("Not found");`,
        `  return res.json(invoice); });`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 queries by primary key without scoping by the authenticated user or tenant ID!',
    }),
  },
  {
    topic: 'Unhandled Promise Rejection Crash',
    build: (sys, num) => ({
      title: `${sys} Alert Dispatch Worker`,
      lines: [
        `app.post("/api/v1/alerts", (req, res) => {`,
        `  dispatchIncidentToSlack(req.body); // unhandled rejected promise crashes worker process 💣`,
        `  return res.status(202).json({ queued: true }); });`,
        `async function dispatchIncidentToSlack(b) { throw new Error("Slack API timeout"); }`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 fires an asynchronous promise without .catch() or await, triggering unhandledRejection!',
    }),
  },
  {
    topic: 'Arithmetic Division By Zero Trap',
    build: (sys, num) => ({
      title: `${sys} Risk Margin Calculator`,
      lines: [
        `const totalCollateral = portfolio.collateralAssets;`,
        `const activeLiabilities = portfolio.liabilities - portfolio.clearedDebt;`,
        `const riskIndex = totalCollateral / activeLiabilities; // division by zero when liabilities equal debt 💣`,
        `await recordRiskAuditScore(portfolio.id, riskIndex);`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 divides by activeLiabilities without checking for zero, producing Infinity or NaN!',
    }),
  },
  {
    topic: 'Remote Code Execution Via Eval',
    build: (sys, num) => ({
      title: `${sys} Dynamic Rule Evaluator`,
      lines: [
        `export function executeDynamicFilter(record, expression) {`,
        `  const evalResult = eval("record." + expression); // remote code execution via untrusted string 💣`,
        `  return Boolean(evalResult); }`,
        `export function applyQuery(req) { return executeDynamicFilter(req.body, req.query.expr); }`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 executes arbitrary user-supplied string in eval(), opening critical Remote Code Execution!',
    }),
  },
  {
    topic: 'Predictable Pseudo-Random Generation',
    build: (sys, num) => ({
      title: `${sys} Password Reset Service`,
      lines: [
        `export function generatePasswordResetToken() {`,
        `  const randomToken = Math.random().toString(36).substring(2); // pseudo-random PRNG predictable token 💣`,
        `  return hashToken(randomToken); }`,
        `export async function queueReset(email) { const t = generatePasswordResetToken(); await mailer.send(email, t); }`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 uses Math.random() which is cryptographically non-secure and easily predictable!',
    }),
  },
  {
    topic: 'Webhook Replay Vulnerability',
    build: (sys, num) => ({
      title: `${sys} Payment Webhook Receiver`,
      lines: [
        `const signature = req.headers["x-hub-signature"];`,
        `const isValid = verifySignature(signature, req.rawBody);`,
        `if (isValid) await processPaymentEvent(req.body); // missing timestamp & nonce check enables replay attack 💣`,
        `return res.status(200).send("OK");`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 processes payments without checking request timestamps or nonces, allowing replay attacks!',
    }),
  },
  {
    topic: 'Localhost Hardcoding In Production',
    build: (sys, num) => ({
      title: `${sys} Outbound Settlement Client`,
      lines: [
        `export async function forwardToPaymentSettlement(wirePayload) {`,
        `  const endpoint = "http://localhost:8080/v1/settle"; // hardcoded local address fails in cloud container 💣`,
        `  const response = await fetch(endpoint, { method: "POST", body: JSON.stringify(wirePayload) });`,
        `  return await response.json(); }`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 hardcodes http://localhost:8080 which fails immediately inside containerized Kubernetes pods!',
    }),
  },
  {
    topic: 'Insecure TLS Certificate Verification',
    build: (sys, num) => ({
      title: `${sys} Secure Vault Proxy`,
      lines: [
        `const agent = new https.Agent({`,
        `  rejectUnauthorized: false, // disables TLS cert verification, allowing Man-in-the-Middle attacks 💣`,
        `  timeout: 5000 });`,
        `return axios.get("https://core-ledger.internal/api", { httpsAgent: agent });`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 disables TLS certificate validation, leaving production traffic exposed to MITM intercept!',
    }),
  },
  {
    topic: 'NoSQL Operator Injection',
    build: (sys, num) => ({
      title: `${sys} Customer Auth Repository`,
      lines: [
        `app.post("/api/v1/auth", async (req, res) => {`,
        `  const { username, password } = req.body; // payload: { "password": { "$ne": null } }`,
        `  const user = await usersCollection.findOne({ username, password }); // NoSQL injection bypasses password 💣`,
        `  return res.json({ session: user ? createToken(user) : null }); });`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 passes raw request body objects to findOne(), allowing NoSQL operator injection ($ne)!',
    }),
  },
  {
    topic: 'Memory Leak Without TTL',
    build: (sys, num) => ({
      title: `${sys} Session Token Storage`,
      lines: [
        `export async function storeSessionToken(sessionId, tokenData) {`,
        `  await redisClient.set(\`sess:\${sessionId}\`, JSON.stringify(tokenData)); // missing TTL leaks RAM indefinitely 💣`,
        `  return sessionId; }`,
        `export async function getSession(sessionId) { return await redisClient.get(\`sess:\${sessionId}\`); }`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 stores session keys in Redis without an expiration TTL, saturating cluster RAM!',
    }),
  },
  {
    topic: 'Message Loss Auto-Commit',
    build: (sys, num) => ({
      title: `${sys} Kafka Event Pipeline`,
      lines: [
        `await consumer.run({`,
        `  autoCommit: true, // auto-commits offset before handleRecord completes, causing message loss on crash 💣`,
        `  eachMessage: async ({ message }) => { await processHeavyETL(message.value); } });`,
        `console.log("Kafka consumer worker running");`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 enables autoCommit, permanently losing uncommitted records if the worker pod restarts!',
    }),
  },
  {
    topic: 'Prototype Pollution Injection',
    build: (sys, num) => ({
      title: `${sys} Global Config Merger`,
      lines: [
        `export function mergeConfig(target, source) {`,
        `  for (const key of Object.keys(source)) {`,
        `    target[key] = source[key]; // vulnerable to __proto__ prototype pollution attacks 💣`,
        `  } return target; }`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 assigns properties without filtering out __proto__, exposing prototype pollution vulnerabilities!',
    }),
  },
  {
    topic: 'Silent Exception Suppression',
    build: (sys, num) => ({
      title: `${sys} Financial Journal Logger`,
      lines: [
        `try {`,
        `  await auditLedger.recordFinancialEntry(tx);`,
        `} catch (err) { /* silent catch block hides failed journal entries 💣 */ }`,
        `return { status: "COMPLETED", confirmationCode: tx.id };`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 silently discards database exceptions, leaving financial books out of balance!',
    }),
  },
  {
    topic: 'Timing Attack Vulnerability',
    build: (sys, num) => ({
      title: `${sys} API Key Authenticator`,
      lines: [
        `export function verifyApiKey(providedKey, secretKey) {`,
        `  if (providedKey === secretKey) return true; // non-constant time comparison allows timing attacks 💣`,
        `  return false; }`,
        `export function authMiddleware(req, res, next) { if (verifyApiKey(req.headers.key, KEY)) next(); }`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 uses === for token comparison, leaking character positions via timing channel attacks!',
    }),
  },
  {
    topic: 'XML External Entity (XXE) Vulnerability',
    build: (sys, num) => ({
      title: `${sys} XML Payload Ingestion`,
      lines: [
        `const parser = new xml2js.Parser({`,
        `  allowExternalEntities: true, // enables XXE file reading and SSRF attacks 💣`,
        `  explicitArray: false });`,
        `const parsed = await parser.parseStringPromise(req.body);`,
      ],
      bugLineIndex: 1,
      explanation: 'Line 2 enables external entities, allowing malicious XML payloads to read local files via XXE!',
    }),
  },
  {
    topic: 'Shared Mutable Singleton State',
    build: (sys, num) => ({
      title: `${sys} Multi-Tenant Config Store`,
      lines: [
        `const tenantCache = {}; // shared module-level state across all tenants`,
        `export function setTenantSettings(tenantId, settings) {`,
        `  tenantCache.current = settings; // overwrites current settings globally for all concurrent requests 💣`,
        `  return tenantCache.current; }`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 stores tenant context in a global singleton, cross-contaminating concurrent tenant data!',
    }),
  },
  {
    topic: 'Missing Rate Limit Increment',
    build: (sys, num) => ({
      title: `${sys} DDoS Rate Limiter`,
      lines: [
        `const count = await cache.get(\`ratelimit:\${ip}\`);`,
        `if (count && count > 100) throw new RateLimitExceeded();`,
        `// missing cache.incr(\`ratelimit:\${ip}\`) allows infinite requests without throttling 💣`,
        `return handleDownstreamService(req);`,
      ],
      bugLineIndex: 2,
      explanation: 'Line 3 checks the rate limit threshold but forgets to increment the counter, bypassing rate limiting!',
    }),
  },
];

// ────────────────────────────────────────────────
// Funny Emoji Mini-Game Templates & Generator
// ────────────────────────────────────────────────
const POOLS = {
  animals: ['🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🦁', '🐯', '🐨', '🐙', '🦄', '🐧', '🦉', '🦋', '🦖', '🐬', '🦥', '🦩'],
  food:    ['🍕', '🍔', '🍟', '🍎', '🍌', '🍇', '🍩', '🌮', '🍉', '🥑', '🧁', '🍰', '🍦', '🍿', '🍣', '🍪', '🥞', '🥨'],
  tech:    ['💻', '📱', '🔌', '🔋', '🤖', '🛰️', '💾', '🖱️', '⌨️', '📡', '🎮', '🕹️', '🕶️', '🚀', '📟', '👾', '🎧', '🔬'],
  faces:   ['😀', '😎', '🤓', '😴', '🤯', '🥳', '😡', '🤖', '👻', '😺', '🤡', '🥸', '🤠', '🕵️', '👽', '🤪', '🤫', '🤩'],
  objects: ['⚽', '🎸', '🚗', '⏰', '🎈', '🔑', '📦', '🎁', '🧲', '🔔', '💎', '🎯', '👑', '🏆', '🪄', '📢', '🧰', '💎'],
  nature:  ['🌸', '🌻', '🌵', '🍀', '🌈', '⭐', '🌙', '☀️', '🌊', '🔥', '❄️', '🍂', '⚡', '🌋', '🍄', '🪐', '🌴', '🍁'],
  magic:   ['🧙‍♂️', '🪄', '🔮', '✨', '🗝️', '📜', '🏰', '🐉', '🕯️', '🧪', '🧿', '🦄', '🧞', '🪙', '🦉', '🪞'],
  sports:  ['⚽', '🏀', '🎾', '🏈', '🎱', '🏓', '🥊', '🏹', '🛹', '⛷️', '🏄‍♂️', '🏋️', '🚴', '🏆', '🏅', '⛳'],
};
const POOL_KEYS = Object.keys(POOLS);

const BOOTH_SKIN = {
  'booth-1': { pool: 'tech',    win: ['Zero Trust? Zero mistakes! 🛡️', 'Firewall champion! 🔥', 'Data guardian supreme! 🗄️', 'Vault unlocked! 🔑'], lose: ['Even firewalls blink 🔥', 'Even robots miss sometimes 🤖', 'Try again, security hero! 💪'] },
  'booth-2': { pool: 'magic',   win: ['Agent approved! 🤖', 'Digital identity verified! ✅', 'AI superstar! 🌟', 'Autonomous genius! ⚡'], lose: ['The agent needs coffee ☕', 'Back to the training data! 📊', 'Almost autonomous! 🤖'] },
  'booth-3': { pool: 'objects', win: ['Merged to main! 🚀', 'PR approved with confetti! 🎉', 'Code wizard! 🧙‍♂️', 'Zero build errors! ✨'], lose: ['Works on my machine 😅', 'git reset --hard 💔', 'Compile error in heart 💔'] },
  'booth-4': { pool: 'nature',  win: ['Cloud-native champ ☁️', 'Scaled to infinity! ♾️', 'Migration master! 🦅', 'Kubernetes tamer! 🪐'], lose: ['Cloud bill shock 💸', 'Pod not found 🫣', 'Still on-prem in spirit 🏚️'] },
  'booth-5': { pool: 'tech',    win: ['Tokens saved! 💰', 'Model deployed! 🚀', 'AI ops legend! 🏆', 'Zero hallucination! 🎯'], lose: ['Model hallucinated 🌀', 'GPU went brrrr 🥶', 'Overfitting detected 📉'] },
  'booth-6': { pool: 'sports',  win: ['Automated! ⚡', 'Process perfection! 💎', 'BI brilliance! 📊', 'Workflow speedrun! 🏎️'], lose: ['Back to Excel 📊', 'VLOOKUPs forever 😭', 'Spreadsheet strikes back 📋'] },
  'booth-7': { pool: 'faces',   win: ['Risk cleared! 🏦', 'Fraud busted! 🕵️', 'Compliant king! 👑', 'Ledger balanced! 💰'], lose: ['Flagged for review 🚩', 'Audit incoming 📝', 'Risk tolerance exceeded 😬'] },
  'booth-8': { pool: 'animals', win: ['Zero downtime! 🟢', 'SRE hero badge! 🦸', 'Uptime warrior! ⚔️', 'Four nines achieved! 🛡️'], lose: ['Chaos Monkey won 🐒', 'Pager went off 📟', '500 Internal LOL 😂'] },
  'booth-9': { pool: 'food',    win: ['All tests green ✅', 'Pipeline perfection! 🎯', 'Quality queen! 👸', 'Shipped with pizza! 🍕'], lose: ['Flaky test strikes 🎲', 'Build broke at 5pm 😱', 'Coverage dropped 📉'] },
};

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sample(r, a, n) {
  return [...a].sort(() => r() - 0.5).slice(0, n);
}

const TRICKY_PAIRS = [
  ['🐱', '🐶'], ['🍎', '🍏'], ['🌝', '🌚'], ['🍩', '🍪'], ['🚗', '🏎️'],
  ['⚡', '💡'], ['🐊', '🦎'], ['🐧', '🦆'], ['🤖', '👾'], ['🍦', '🍧'],
  ['🍕', '🍔'], ['⭐', '🌟'], ['🔥', '💥'], ['🌧️', '⛈️'], ['⚽', '🏀'],
  ['💎', '💣'], ['🚀', '🛸'], ['🍀', '🍂'], ['🎈', '📌'], ['☕', '🥛'],
];

const SORT_SETS = [
  { buckets: ['🍎 Fruit', '🥕 Veggie'], items: [['🍌', 0], ['🥦', 1], ['🍇', 0], ['🥕', 1], ['🍓', 0], ['🌽', 1]] },
  { buckets: ['☁️ Cloud', '🖥️ On-Prem'], items: [['☁️', 0], ['🖱️', 1], ['💾', 1], ['🌐', 0], ['📡', 0], ['🖨️', 1]] },
  { buckets: ['🌞 Day', '🌙 Night'], items: [['☀️', 0], ['🌟', 1], ['🐓', 0], ['🦉', 1], ['☕', 0], ['🌙', 1]] },
  { buckets: ['🔥 Hot', '❄️ Cold'], items: [['🌶️', 0], ['🧊', 1], ['🏜️', 0], ['⛷️', 1], ['🔥', 0], ['🍦', 1]] },
  { buckets: ['✅ Safe', '🎣 Phish'], items: [['🔒', 0], ['📧', 1], ['🛡️', 0], ['🎁', 1], ['✅', 0], ['⚠️', 1]] },
  { buckets: ['🐱 Cat', '🐶 Dog'], items: [['😺', 0], ['🐕', 1], ['🐈', 0], ['🦮', 1], ['😸', 0], ['🐩', 1]] },
  { buckets: ['🍕 Fast Food', '🥗 Healthy'], items: [['🍔', 0], ['🥦', 1], ['🍟', 0], ['🥗', 1], ['🍕', 0], ['🥑', 1]] },
  { buckets: ['☕ Morning Fuel', '😴 Midnight Snack'], items: [['☕', 0], ['🍿', 1], ['🥐', 0], ['🍪', 1], ['🥞', 0], ['🍫', 1]] },
  { buckets: ['🦸 Hero', '🦹 Villain'], items: [['🦸', 0], ['🦹', 1], ['🛡️', 0], ['💣', 1], ['✨', 0], ['💀', 1]] },
  { buckets: ['🚀 Fast', '🐢 Slow'], items: [['🏎️', 0], ['🐢', 1], ['⚡', 0], ['🦥', 1], ['🚀', 0], ['🐌', 1]] },
  { buckets: ['🏖️ Beach', '🏔️ Mountain'], items: [['🌊', 0], ['⛷️', 1], ['🌴', 0], ['🧗', 1], ['🏖️', 0], ['❄️', 1]] },
  { buckets: ['🎮 Gaming', '💼 Office Work'], items: [['🕹️', 0], ['💼', 1], ['🎮', 0], ['🗂️', 1], ['👾', 0], ['📊', 1]] },
  { buckets: ['💻 Frontend', '🖧 Backend'], items: [['🎨', 0], ['🗄️', 1], ['📱', 0], ['🔌', 1], ['✨', 0], ['💾', 1]] },
  { buckets: ['🟢 Ship to Prod', '🔴 Rollback Now'], items: [['🚀', 0], ['💣', 1], ['✅', 0], ['🔥', 1], ['🎉', 0], ['🚨', 1]] },
  { buckets: ['🤖 AI Agent', '👨‍💼 Real Human'], items: [['🤖', 0], ['👨‍💼', 1], ['🦾', 0], ['☕', 1], ['🧠', 0], ['😴', 1]] },
];

const CROWD_CHALLENGES = [
  { icon: '🎈', challenge: 'Pretend to inflate an invisible balloon until it pops! 💥' },
  { icon: '🗣️', challenge: 'Say "Kubernetes orchestrates containers" 3 times super fast!' },
  { icon: '🤳', challenge: 'Copy this emoji face perfectly: 🤪' },
  { icon: '🙆', challenge: 'Do a 5-second desk stretch! Show us those moves!' },
  { icon: '🤖', challenge: 'Do your best robot dance for 5 seconds!' },
  { icon: '🎤', challenge: 'Sing "Hello World" in an opera voice!' },
  { icon: '🦸', challenge: 'Strike your best superhero pose!' },
  { icon: '🦁', challenge: 'Do your best wild animal impression (meow or roar)!' },
  { icon: '💃', challenge: 'Do the victory floss dance for 5 seconds!' },
  { icon: '🧘', challenge: 'Hold a yoga tree pose for 5 seconds without wobbling!' },
  { icon: '🎭', challenge: 'Act surprised like you just won a billion dollars!' },
  { icon: '🏋️', challenge: 'Pretend to lift an invisible 500kg heavy weight!' },
  { icon: '🎸', challenge: 'Unleash an epic air guitar rock solo for 5 seconds!' },
  { icon: '🕶️', challenge: 'Perform a slow-motion Matrix bullet dodge!' },
  { icon: '✋', challenge: 'Give the nearest attendee an energetic high-five!' },
  { icon: '😉', challenge: 'Wink alternately with both eyes as fast as you can!' },
  { icon: '🍋', challenge: 'Make a face like you just bit into an ultra-sour lemon!' },
  { icon: '🏆', challenge: 'Show us your Olympic slow-motion gold medal celebration!' },
  { icon: '🏎️', challenge: 'Pretend your hands are on a Formula 1 steering wheel!' },
  { icon: '🕺', challenge: 'Do the moonwalk in place for 5 seconds!' },
];

const GAME_BUILDERS = {
  memory_missing: (r, pool) => {
    const shown = sample(r, pool, 6);
    const missingIdx = Math.floor(r() * 6);
    const missing = shown[missingIdx];
    const distractors = shown.filter(e => e !== missing).slice(0, 3);
    const options = sample(r, [missing, ...distractors], 4);
    return {
      q: '🧠 Memory Master: Watch closely… one emoji will vanish!',
      gameData: { shown, missing, options, showMs: 3000, attempts: 2 },
    };
  },

  grid_tap: (r, pool, i) => {
    const pair = TRICKY_PAIRS[i % TRICKY_PAIRS.length] || sample(r, pool, 2);
    const [target, decoy] = pair;
    return {
      q: `🎯 Quick Tap: Tap all the ${target} and avoid ${decoy}!`,
      gameData: { target, decoy, size: 9, goal: 5, durationSec: 15, lives: 3 },
    };
  },

  odd_one: (r, pool, i) => {
    const pair = TRICKY_PAIRS[(i * 3 + 1) % TRICKY_PAIRS.length] || sample(r, pool, 2);
    const [base, odd] = pair;
    return {
      q: '🔍 Spot the Impostor: One emoji doesn\'t belong. Find it!',
      gameData: { base, odd, cells: 12, oddIndex: Math.floor(r() * 12), durationSec: 20, attempts: 2 },
    };
  },

  pair_match: (r, pool) => ({
    q: '🃏 Match Maker: Peek at the cards, then find the matching pairs!',
    gameData: { faces: sample(r, pool, 3), attempts: 2, peekMs: 2000 },
  }),

  sequence: (r) => ({
    q: '🎨 Copy Cat: Watch the sequence, then repeat it!',
    gameData: { colors: ['🔴', '🔵', '🟢', '🟡'], length: 3 + Math.floor(r() * 2), attempts: 2 },
  }),

  timer_stop: (r) => {
    const w = 25 + Math.floor(r() * 10);
    const start = 20 + Math.floor(r() * 40);
    return {
      q: '⏱️ Stop the Bar: Tap when the slider is inside the green zone!',
      gameData: { zoneStart: start, zoneEnd: start + w, speed: 1.2, attempts: 2 },
    };
  },

  luck_pick: (r, pool) => ({
    q: '🎁 Lucky Pick: One of these has the prize. Trust your gut!',
    gameData: {
      slots: 3,
      icon: sample(r, ['🎁', '🚪', '🥤', '🎩', '🧳', '🎪'], 1)[0],
      prize: pool[0] || '🏆',
      rigAfterMisses: 1,
    },
  }),

  sort_bucket: (r, _pool, i) => {
    const setIdx = (i + Math.floor(r() * SORT_SETS.length)) % SORT_SETS.length;
    return {
      q: '🗂️ Sort It: Tap to drop each item in the right bucket!',
      gameData: { ...SORT_SETS[setIdx], mistakes: 2 },
    };
  },

  pattern_quiz: (r, pool) => {
    const [a, b, c] = sample(r, pool, 3);
    const patternType = Math.floor(r() * 3);
    let pattern;
    let answer;

    if (patternType === 0) {
      pattern = [a, b, a, b];
      answer = a;
    } else if (patternType === 1) {
      pattern = [a, a, b, a, a];
      answer = b;
    } else {
      pattern = [a, b, c, a, b];
      answer = c;
    }

    const optionSet = new Set([answer, a, b, c]);
    if (optionSet.size < 4 && pool.length > 3) {
      for (const p of pool) {
        optionSet.add(p);
        if (optionSet.size >= 4) break;
      }
    }
    const options = sample(r, Array.from(optionSet).slice(0, 4), 4);

    return {
      q: `🔢 Pattern Ninja: ${pattern.join(' ')} → ?`,
      gameData: { pattern, options, answer },
    };
  },

  crowd_judge: (r, _pool, i) => {
    const c = CROWD_CHALLENGES[(i + Math.floor(r() * CROWD_CHALLENGES.length)) % CROWD_CHALLENGES.length];
    return {
      q: `🎤 Crowd Challenge: ${c.challenge}`,
      gameData: { ...c, durationSec: 8 },
    };
  },
};

const GAME_TYPES = Object.keys(GAME_BUILDERS);

function buildFunnyGameItem(spec, index) {
  const r = rng(index * 9301 + spec.num * 49297 + spec.id.charCodeAt(Math.min(6, spec.id.length - 1)));
  const gameType = GAME_TYPES[index % GAME_TYPES.length];
  const skin = BOOTH_SKIN[spec.id] || BOOTH_SKIN['booth-1'];

  const boothPool = POOLS[skin.pool] || POOLS.tech;
  const rotatingPool = POOLS[POOL_KEYS[index % POOL_KEYS.length]];
  const pool = [...new Set([...boothPool, ...rotatingPool])];

  const { q, gameData } = GAME_BUILDERS[gameType](r, pool, index);
  const winMsg = skin.win[index % skin.win.length];
  const loseMsg = skin.lose[index % skin.lose.length];

  return {
    id: `${spec.id}_game_${index + 1}`,
    category: 'Mini Game',
    difficulty: 'easy',
    question: q,
    itemType: 'game',
    gameType,
    gameData: { ...gameData, winMsg, loseMsg },
    options: ['Challenge Incomplete', 'Challenge Completed! 🎉'],
    correctAnswer: 1,
  };
}

// Generates 3,000 MCQs and 2,000 Fun Emoji Games for each booth (Total: 5,000 items)
function generateBoothBank(spec, mcqCount = 3000, gameCount = 2000) {
  const bank = [];
  const totalScenarios = spec.scenarios.length;

  // 1. Generate 3,000 MCQs
  for (let i = 0; i < mcqCount; i++) {
    const scen = spec.scenarios[i % totalScenarios];
    const sys = spec.systems[i % spec.systems.length];
    const num = ((i * 17 + 23) % 97) + 3;

    const promptText = scen.prompt(sys, num);

    const resolve = (val) => (typeof val === 'function' ? val(sys, num) : val);
    const correctOption = resolve(scen.correct);
    const plausibleOptions = shuffle(scen.plausible);
    const distractor1 = resolve(plausibleOptions[0]);
    const distractor2 = resolve(plausibleOptions[1] || plausibleOptions[0]);
    const distractor3 = resolve(COMMON_COMEDY_DISTRACTORS[(i * 3 + 7) % COMMON_COMEDY_DISTRACTORS.length]);

    const rawOptions = [correctOption, distractor1, distractor2, distractor3];
    const shuffledOptions = shuffle(rawOptions);
    const correctAnswerIndex = shuffledOptions.indexOf(correctOption);

    const difficulty = i % 4 === 0 ? 'easy' : (i % 4 === 3 ? 'hard' : 'medium');

    bank.push({
      id: `${spec.id}_q_${i + 1}`,
      category: spec.category,
      difficulty,
      question: promptText,
      options: shuffledOptions,
      correctAnswer: correctAnswerIndex,
      itemType: 'mcq',
    });
  }

  // 2. Generate 2,000 Funny Emoji Games
  for (let j = 0; j < gameCount; j++) {
    const game = buildFunnyGameItem(spec, j);
    bank.push(game);
  }

  return bank;
}

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

console.log('🚀 Starting generation of 3,000 MCQs + 2,000 Funny Games per booth (Total: 5,000 items/booth)...\n');

for (const spec of BOOTH_SPECS) {
  console.log(`Generating 3,000 MCQs + 2,000 Games for Booth ${spec.num} (${spec.title})...`);
  const bank = generateBoothBank(spec, 3000, 2000);
  const filePath = path.join(DATA_DIR, `${spec.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(bank, null, 2), 'utf-8');
  console.log(`✓ Wrote ${bank.length.toLocaleString()} items to src/data/${spec.id}.json\n`);
}

console.log('🎉 SUCCESS: All 9 booths now have 3,000 MCQs + 2,000 Funny Games each (Total: 45,000 items)!');


