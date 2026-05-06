'use client';

/**
 * TestimonialSection — Section Đánh giá / Testimonials
 *
 * - Optional title, testimonials array (authorName, role, content, avatarUrl, rating)
 * - Carousel/slider với prev/next navigation
 * - Next.js <Image> với WebP, lazy loading
 * - Apple Design System: card layout
 * - Accessible: H2 cho section title, aria-live cho carousel
 *
 * Requirements: 1.1, 4.6
 */

import Image from 'next/image';
import { useState, useCallback } from 'react';

export interface TestimonialItem {
  authorName: string;
  role: 'Phụ huynh' | 'Học sinh cũ';
  content: string;
  avatarUrl?: string;
  rating: number;
}

export interface TestimonialContent {
  title?: string;
  testimonials: TestimonialItem[];
}

interface TestimonialSectionProps {
  id: string;
  content: TestimonialContent;
  isVisible: boolean;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      aria-label={`${rating} trên 5 sao`}
      style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill={star <= rating ? '#0071E3' : '#EDEDF2'}
          aria-hidden="true"
        >
          <path d="M8 1l1.854 3.756L14 5.528l-3 2.924.708 4.128L8 10.5l-3.708 2.08L5 8.452 2 5.528l4.146-.772L8 1z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialSection({ id, content, isVisible }: TestimonialSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { title, testimonials } = content;

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  }, [testimonials.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  }, [testimonials.length]);

  if (!isVisible) return null;
  if (testimonials.length === 0) return null;

  // Show up to 3 testimonials at a time on desktop
  const itemsPerPage = 3;
  const visibleTestimonials = testimonials.slice(
    currentIndex,
    currentIndex + itemsPerPage
  );
  // Wrap around if needed
  const wrappedTestimonials =
    visibleTestimonials.length < itemsPerPage
      ? [
          ...visibleTestimonials,
          ...testimonials.slice(0, itemsPerPage - visibleTestimonials.length),
        ]
      : visibleTestimonials;

  const displayedTestimonials =
    testimonials.length <= itemsPerPage ? testimonials : wrappedTestimonials;

  return (
    <section
      id={id}
      aria-labelledby={title ? `${id}-title` : undefined}
      style={{
        background: '#F5F5F7',
        padding: '56px 24px',
        borderBottom: '1px solid #EDEDF2',
      }}
    >
      <div style={{ maxWidth: '1262px', margin: '0 auto' }}>
        {title && (
          <h2
            id={`${id}-title`}
            style={{
              fontFamily:
                'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '28px',
              fontWeight: 400,
              lineHeight: '32px',
              color: '#1D1D1F',
              marginBottom: '40px',
              textAlign: 'center',
            }}
          >
            {title}
          </h2>
        )}

        {/* Carousel container */}
        <div style={{ position: 'relative' }}>
          {/* Testimonial cards */}
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(displayedTestimonials.length, 3)}, 1fr)`,
              gap: '24px',
            }}
            className="testimonial-grid"
          >
            {displayedTestimonials.map((testimonial, index) => (
              <article
                key={`${currentIndex}-${index}`}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #EDEDF2',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <StarRating rating={testimonial.rating} />

                <blockquote
                  style={{
                    fontFamily:
                      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '17px',
                    fontWeight: 400,
                    lineHeight: '25px',
                    color: '#333336',
                    margin: 0,
                    flex: 1,
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{testimonial.content}&rdquo;
                </blockquote>

                {/* Author */}
                <footer
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: 'auto',
                  }}
                >
                  {testimonial.avatarUrl ? (
                    <div
                      style={{
                        position: 'relative',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={testimonial.avatarUrl}
                        alt={`Ảnh của ${testimonial.authorName}`}
                        fill
                        loading="lazy"
                        sizes="40px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#EDEDF2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontFamily:
                          'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: '17px',
                        fontWeight: 600,
                        color: '#6E6E73',
                      }}
                      aria-hidden="true"
                    >
                      {testimonial.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        fontFamily:
                          'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: '17px',
                        fontWeight: 600,
                        lineHeight: '21px',
                        color: '#1D1D1F',
                      }}
                    >
                      {testimonial.authorName}
                    </div>
                    <div
                      style={{
                        fontFamily:
                          'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: '12px',
                        fontWeight: 400,
                        lineHeight: '16px',
                        color: '#6E6E73',
                      }}
                    >
                      {testimonial.role}
                    </div>
                  </div>
                </footer>
              </article>
            ))}
          </div>

          {/* Navigation — only show if more than itemsPerPage testimonials */}
          {testimonials.length > itemsPerPage && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                marginTop: '32px',
              }}
            >
              <button
                onClick={goToPrev}
                aria-label="Đánh giá trước"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid #EDEDF2',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1D1D1F',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#F5F5F7';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M10 12L6 8l4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Dots */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {Array.from({
                  length: Math.ceil(testimonials.length / itemsPerPage),
                }).map((_, i) => {
                  const isActive = Math.floor(currentIndex / itemsPerPage) === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i * itemsPerPage)}
                      aria-label={`Trang ${i + 1}`}
                      aria-current={isActive ? 'true' : undefined}
                      style={{
                        width: isActive ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: isActive ? '#0071E3' : '#EDEDF2',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.2s ease',
                      }}
                    />
                  );
                })}
              </div>

              <button
                onClick={goToNext}
                aria-label="Đánh giá tiếp theo"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid #EDEDF2',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1D1D1F',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#F5F5F7';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .testimonial-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .testimonial-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
