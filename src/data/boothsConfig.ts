import type { BoothConfig, QuizQuestion } from '../types';

import booth1Questions from './booth-1.json';
import booth2Questions from './booth-2.json';
import booth3Questions from './booth-3.json';
import booth4Questions from './booth-4.json';
import booth5Questions from './booth-5.json';
import booth6Questions from './booth-6.json';
import booth7Questions from './booth-7.json';
import booth8Questions from './booth-8.json';
import booth9Questions from './booth-9.json';

export const BOOTHS: BoothConfig[] = [
  {
    id: 'booth-1',
    number: 1,
    title: 'Generative AI & LLMs',
    category: 'Artificial Intelligence',
    icon: '🤖',
    badge: 'AI & LLM',
    description: 'Explore neural architectures, prompt engineering, RAG, and frontier models.',
    questions: booth1Questions as QuizQuestion[],
  },
  {
    id: 'booth-2',
    number: 2,
    title: 'Cloud Native & Kubernetes',
    category: 'Cloud Infrastructure',
    icon: '☁️',
    badge: 'Cloud & K8s',
    description: 'Master microservices orchestration, auto-scaling, serverless, and mesh topologies.',
    questions: booth2Questions as QuizQuestion[],
  },
  {
    id: 'booth-3',
    number: 3,
    title: 'Cybersecurity & Zero Trust',
    category: 'Information Security',
    icon: '🛡️',
    badge: 'Security',
    description: 'Verify every request, defend supply chains, and master cryptographic principles.',
    questions: booth3Questions as QuizQuestion[],
  },
  {
    id: 'booth-4',
    number: 4,
    title: 'Data Engineering & Lakehouse',
    category: 'Data & Analytics',
    icon: '📊',
    badge: 'Data & Analytics',
    description: 'Tackle real-time streaming, vector stores, ACID transactions, and ELT pipelines.',
    questions: booth4Questions as QuizQuestion[],
  },
  {
    id: 'booth-5',
    number: 5,
    title: 'DevOps, SRE & CI/CD',
    category: 'DevOps & Reliability',
    icon: '⚙️',
    badge: 'DevOps & SRE',
    description: 'Accelerate continuous delivery, observability pillars, and error budget management.',
    questions: booth5Questions as QuizQuestion[],
  },
  {
    id: 'booth-6',
    number: 6,
    title: 'Software Architecture & APIs',
    category: 'System Design',
    icon: '🏛️',
    badge: 'Architecture',
    description: 'Design decoupled event-driven systems, resilient gateways, and scalable patterns.',
    questions: booth6Questions as QuizQuestion[],
  },
  {
    id: 'booth-7',
    number: 7,
    title: 'IoT & Edge Computing',
    category: 'Edge & Connected Tech',
    icon: '📡',
    badge: 'IoT & Edge',
    description: 'Harness low-latency computation, digital twins, and lightweight protocols.',
    questions: booth7Questions as QuizQuestion[],
  },
  {
    id: 'booth-8',
    number: 8,
    title: 'Web3 & Distributed Ledgers',
    category: 'Blockchain & Consensus',
    icon: '🔗',
    badge: 'Web3 & Blockchain',
    description: 'Uncover smart contracts, decentralized state, rollups, and zero-knowledge proofs.',
    questions: booth8Questions as QuizQuestion[],
  },
  {
    id: 'booth-9',
    number: 9,
    title: 'Quantum & Emerging Horizons',
    category: 'Quantum Computing',
    icon: '⚛️',
    badge: 'Quantum & Frontiers',
    description: 'Leap into superposition, entanglement, quantum speedups, and future horizons.',
    questions: booth9Questions as QuizQuestion[],
  },
];

export const REQUIRED_BOOTHS_TO_WIN = 4;
export const TOTAL_BOOTHS = 9;

export function getBoothById(idOrNumber: string | number | null | undefined): BoothConfig | null {
  if (!idOrNumber) return null;
  const str = String(idOrNumber).trim().toLowerCase();
  
  // match "1", "booth-1", "booth1"
  return (
    BOOTHS.find(
      (b) =>
        b.id.toLowerCase() === str ||
        String(b.number) === str ||
        `booth${b.number}` === str ||
        `booth-${b.number}` === str,
    ) || null
  );
}

export function getAllBooths(): BoothConfig[] {
  return BOOTHS;
}
