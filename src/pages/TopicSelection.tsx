import type { BoothConfig, BoothTopic } from '../types';
import { Button } from '../components/Button';
import { getBoothIcon, ClockIcon } from '../components/Icons';

interface TopicSelectionProps {
  booth: BoothConfig;
  onSelectTopic: (topic: BoothTopic) => void;
  onBack: () => void;
}

export function TopicSelection({ booth, onSelectTopic, onBack }: TopicSelectionProps) {
  const topics = booth.topics && booth.topics.length > 0 ? booth.topics : [];

  return (
    <div className="ts-page ts-page--topics">
      <div className="ts-page__container ts-page__container--wide">
        {/* Booth Header Pill */}
        <div className="ts-topics-header">
          <div className="ts-topics-badge">
            <span className="ts-topics-badge__icon">{getBoothIcon(booth.number, 18)}</span>
            <span className="ts-topics-badge__label">BOOTH {booth.number} • {booth.badge}</span>
          </div>

          <h1 className="ts-page__title ts-page__title--sm">
            {booth.title}
          </h1>

          <p className="ts-page__description">
            {booth.description}
          </p>
        </div>

        {/* 20-Minute Rotating Topics Notice */}
        <div className="ts-topics-rotation-banner">
          <div className="ts-rotation-icon" aria-hidden="true"><ClockIcon size={24} /></div>
          <div className="ts-rotation-content">
            <h2 className="ts-rotation-title">20-MINUTE ROTATING TOPICS</h2>
            <p className="ts-rotation-desc">
              Topics at this booth rotate every 20 minutes throughout the Summit.
              Select the active session topic below to begin your 60-second challenge:
            </p>
          </div>
        </div>

        {/* Topics List */}
        <div className="ts-topics-grid">
          {topics.length > 0 ? (
            topics.map((topic, index) => (
              <div key={topic.id} className="ts-topic-card">
                <div className="ts-topic-card__header">
                  <span className="ts-topic-card__index">TOPIC {index + 1}</span>
                  <span className="ts-topic-card__count">{topic.questionCount} Questions • 60s</span>
                </div>

                <div className="ts-topic-card__body">
                  <h3 className="ts-topic-card__title">{topic.title}</h3>
                  {topic.description && (
                    <p className="ts-topic-card__desc">{topic.description}</p>
                  )}
                </div>

                <div className="ts-topic-card__action">
                  <Button
                    onClick={() => onSelectTopic(topic)}
                    fullWidth
                  >
                    SELECT TOPIC & START QUIZ →
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="ts-topic-card">
              <div className="ts-topic-card__header">
                <span className="ts-topic-card__index">DEFAULT TOPIC</span>
                <span className="ts-topic-card__count">5 Questions • 60s</span>
              </div>
              <div className="ts-topic-card__body">
                <h3 className="ts-topic-card__title">{booth.title} Standard Challenge</h3>
                <p className="ts-topic-card__desc">Complete 5 questions covering core concepts.</p>
              </div>
              <div className="ts-topic-card__action">
                <Button
                  onClick={() =>
                    onSelectTopic({
                      id: `${booth.id}_default`,
                      boothId: booth.id,
                      topicKey: 'default',
                      title: booth.title,
                      questions: booth.questions,
                      questionCount: booth.questions.length,
                    })
                  }
                  fullWidth
                >
                  START CHALLENGE →
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Back action */}
        <div className="ts-topics-actions">
          <Button variant="secondary" onClick={onBack}>
            ← RETURN TO PASSPORT
          </Button>
        </div>
      </div>
    </div>
  );
}
