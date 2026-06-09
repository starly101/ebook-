# AUDIT LOG - Study Vault Monorepo Conversion

## Project Overview
- **Source Repository**: git@github.com:starly101/study_vault-mali.git (turborepo with Next.js monorepo)
- **Target Repository**: git@github.com:starly101/ebook-.git (separated backend + student frontend)
- **Audit Date**: 2025-01-XX
- **Auditor**: AI Code Expert

## Clone Status
- Source: `/mnt/oss/qwen-workspace/source/study_vault_onyx/` - 257 TS/JS files
- Target: `/mnt/oss/qwen-workspace/target/ebook/` - 207 TS/JS files
- Audit Output: `/mnt/oss/qwen-workspace/audit-output/`

---

## PHASE 1: BACKEND AUDIT

### Step 1.1 - Source Inventory (study_vault_onyx/packages/)

#### Database Models (packages/db/models/):
1. **User.js** - Complete user schema with:
   - Basic fields: name, email, password_hash, avatar_url
   - Role enum: student, parent, teacher, admin, superadmin
   - Google OAuth: google_id, google_email
   - Auth state: is_verified, otp, otp_expires_at, password_reset_token, password_reset_expires
   - Student profile: program_ids, board_id, active_program_id, board, grade, class, medium, onboarding_completed, xp_total, streak_days, last_active
   - Legacy fields: board, grade, class, onboardingComplete, savedBooks
   - Parent fields: linked_children, parent_id
   - Subscription: plan, status, expires_at, ai_credits_used_today, ai_credits_reset_at
   - Session guard: active_session_token, active_device_fingerprint
   - Teacher profile: assigned_book_ids, assigned_program_ids
   - Indexes: google_id, role, subscription.plan, board+grade

2. **Book.js** - Book schema with:
   - Identity: title, slug (unique), subject, subject_slug
   - Hierarchy: board, grade, program_id, board_id
   - Edition: edition_year, edition_label, is_current_edition, previous_edition_id
   - Metadata: authors, publisher, publication_city, isbn, total_pages, language, script_direction, grade_level, curriculum_year
   - SEO: meta_title, meta_description, keywords, og_image_url
   - Stats: total_chapters, total_topics
   - Ingestion: ingestion_status, ingestion_log
   - Status: is_live, original_pdf_url, cover_image_url
   - Audit: created_by, approved_by, approved_at
   - Indexes: program_id+board_id+subject_slug, program_id+is_live, is_current_edition, text search, board+grade+is_live, board_id+program_id, subject_slug+is_live

3. **Topic.js** - EXTENSIVE topic schema with:
   - ContentBlockSchema (embedded): type (15 enums), text, html, latex, formula_label, table headers/rows, image caption/src/alt, figure_number, list items, callout variant, mcq/question/problem/definition fields, quran_data with word_alignments
   - Identity: title, title_urdu, slug, topic_number, display_order
   - Hierarchy (denormalized): book_id, chapter_id, program_id, board_id, program_name, subject_name, chapter_number, chapter_title
   - Content layers: raw_text, clean_html, content_blocks [ContentBlockSchema]
   - Quran reference: surah, ayah, surah_name_arabic/english, juz, manzil, ruku
   - Quran word alignments: position, textbook_urdu_meaning, color_highlight, grammar_note
   - Quran translation/tafsir: quran_textbook_translation, quran_textbook_tafsir
   - Extracted intelligence: formulas, key_terms, book_mcqs, book_short_questions, book_problems, keywords, difficulty, estimated_read_time
   - Version control: edition_year, version_status, previous_version_id, content_hash
   - Exam frequency: board_id, board_short_code, board_name, total_appearances, appearance_by_year, last_appeared_year, is_hot_topic
   - AI cache: explanation (text/generated_at/model_used/is_approved), explanation_urdu, tts_audio, flashcards
   - SEO: meta_title, meta_description, keywords, json_ld, canonical_url, og_image_url, source_page
   - Status: is_live, guest_preview_percent, workflow_status, admin_notes, created_by, approved_by, approved_at
   - 12 indexes including compound and text indexes

4. **Chapter.js** - Chapter schema with:
   - Identity: title, slug, chapter_number, chapter_number_display
   - Hierarchy: book_id, program_id, board_id
   - Content: student_learning_outcomes, summary, summary_urdu, page_start, page_end
   - Relations: topic_ids, total_topics
   - Exam frequency: board_id, board_short_code, total_appearances, last_appeared_year, is_hot
   - SEO: meta_title, meta_description, keywords
   - Status: is_live, display_order
   - Indexes: book_id+chapter_number, book_id+is_live, slug+book_id (unique)

5. **Program.js** - Program schema with:
   - Identity: name, slug (unique), short_name
   - Type: program_type (academic/entrance_exam/professional/language/custom), is_linear, requires_textbook
   - Display: description, icon_url, color_hex, display_order, is_active, is_featured
   - Access: access_tier (free/basic/premium)
   - Boards: applicable_boards [{board_id, board_name}]
   - Audit: created_by
   - Indexes: program_type+is_active, is_featured

6. **Board.js** - Board schema with:
   - Identity: name, slug (unique), short_code
   - Hierarchy: program_id
   - Location: city, province, country
   - Status: is_active
   - Indexes: short_code, program_id+slug (unique)

7. **UserProgress.js** - Progress tracking:
   - References: user_id, topic_id, chapter_id, book_id, program_id
   - Reading: is_read, scroll_depth_percent, time_spent_seconds
   - Quiz: quiz_attempts, highest_quiz_score, last_quiz_score, mastery_status (locked/in_progress/mastered)
   - Calculation: progress_percent (70% quiz + 30% reading), xp_earned
   - Tracking: last_accessed
   - Indexes: user_id+topic_id (unique), user_id+program_id, user_id+mastery_status, user_id+chapter_id, user_id+book_id

8. **UserVault.js** - User saved items:
   - References: user_id, topic_id, chapter_id, program_id
   - Type: flashcard/video_link/bookmark/note/highlight
   - Flashcard: front, back, is_ai_generated
   - Video: url, title, thumbnail_url, platform
   - Highlight: text, block_order, color
   - Note: text
   - Review: review_status, last_reviewed
   - Indexes: user_id+topic_id, user_id+type, user_id+program_id

9. **Quiz.js** - Quiz attempts:
   - References: user_id, topic_id, chapter_id, book_id, program_id
   - Score: score (0-100), answers [{questionId, selected, isCorrect, timeSpent}]
   - Stats: time_spent, correct_count, total_questions, accuracy_percentage
   - Difficulty breakdown: [{difficulty, correct, total}]
   - Device: platform, browser
   - Timestamps: created_at
   - Indexes: user_id+created_at, user_id+topic_id, topic_id+created_at, score

10. **Question.js** - Question bank:
    - References: topic_id, chapter_id, book_id, program_id
    - Type: mcq/short/long/numerical/fill_blank/true_false
    - Content: question, options, correct_answer, explanation, steps
    - Source: book/ai_generated/teacher/past_paper
    - Past paper: board_id, board_short_code, year, question_type_label
    - Verification: is_verified, verified_by, difficulty
    - Analytics: total_attempts, correct_attempts, distractor_stats
    - Audit: created_by
    - Indexes: topic_id+type+source, topic_id+is_verified, past_paper.board_id+year

11. **QuranVerse.js** - Simple Quran verse storage:
    - surah, ayah, text_uthmani
    - Unique index: surah+ayah

12. **QuranWord.js** - Word-by-word Quran data:
    - surah, ayah, word_position
    - arabic_word, root_word, transliteration, global_urdu_meaning
    - Unique index: surah+ayah+word_position

13. **Subscription.js** - Subscription management:
    - user_id, plan, status, started_at, expires_at, cancelled_at, cancel_reason
    - Payment: payment_provider, payment_id, amount, currency
    - Usage: ai_credits_total, ai_credits_used, download_count
    - Auto-renewal: auto_renew, renewal_reminder_sent
    - Admin: notes, created_by
    - Indexes: user_id+status, plan+status, expires_at

#### Lib Files (packages/lib/):
1. **auth/options.ts** - NextAuth configuration wrapper
2. **auth/unified-auth.ts** - Complete auth logic:
   - Google OAuth provider setup
   - Credentials provider fallback
   - signIn callback: creates/updates users in DB
   - session callback: enriches session with user data
   - jwt callback: adds user info to token
   - redirect callback: handles post-auth redirects
   - Helper functions: getUnifiedUser, createJWTToken, verifyJWTToken

3. **auth/getAuthUser.ts** - Unified auth function:
   - Tries Authorization header (Bearer token)
   - Falls back to sv_token cookie
   - Falls back to NextAuth session
   - Returns standardized AuthUser object
   - requireAuthUser helper for API routes

4. **ingestion/IngestionEngine.ts** - PDF-to-JSON ingestion pipeline:
   - processBookIngestion function
   - Steps: Upsert Program → Upsert Board → Upsert Book → Upsert Chapter → Upsert Topics
   - Content hash-based deduplication
   - Handles key_terms normalization
   - Concatenates raw_text/clean_html from content_blocks
   - Full error handling with logging

5. **utils/api-response.ts** - Standardized API responses:
   - successResponse, errorResponse, unauthorizedResponse helpers
   - normalizeSlug utility

### Step 1.2 - Target Backend Inventory (ebook/backend/src/)

#### Models (src/models/):
- User.js - SIMPLIFIED (missing many fields)
- Book.js - SIMPLIFIED (missing many fields)
- Topic.js - COMPLETE (matches source)
- Chapter.js - Need to check
- Program.js - Need to check
- Board.js - Need to check
- UserProgress.js - COMPLETE (matches source)
- UserVault.js - COMPLETE (matches source)
- Quiz.js - Need to check
- Question.js - Need to check
- QuranVerse.js - Need to check
- QuranWord.js - Need to check
- Subscription.js - Need to check

#### Controllers (src/controllers/):
- auth.controller.js
- book.controller.js
- topic.controller.js
- vault.controller.js
- progress.controller.js
- quiz.controller.js
- search.controller.js
- ai.controller.js
- dashboard.controller.js
- ingestion.controller.js
- checkout.controller.js
- webhook.controller.js

#### Services (src/services/):
- auth.service.js
- book.service.js
- topic.service.js
- vault.service.js
- progress.service.js
- quiz.service.js
- search.service.js
- ai.service.js
- dashboard.service.js
- ingestion.service.js
- checkout.service.js
- stripe.service.js

#### Middleware (src/middleware/):
- auth.js (requireAuth, requireAdmin, optionalAuth)
- errorHandler.js
- rateLimit.js
- validate.js

#### Routes (src/routes/):
- All matching controllers

#### Config (src/config/):
- env.js (Zod validation)
- db.js (Mongoose connection)
- ai.js

#### Utils (src/utils/):
- apiResponse.js
- hash.js
- slug.js
- contentBlocks.js
- progress.js

### Step 1.3 - GAP ANALYSIS

#### CRITICAL GAPS FOUND:

1. **User Model - MISSING FIELDS**:
   - Missing: password_hash (uses 'password' instead)
   - Missing: role enum values (only 'user', 'admin' vs 'student', 'parent', 'teacher', 'admin', 'superadmin')
   - Missing: google_email field
   - Missing: is_verified, otp, otp_expires_at, password_reset_token, password_reset_expires
   - Missing: ENTIRE student_profile embedded document (program_ids, board_id, active_program_id, board, grade, class, medium, onboarding_completed, xp_total, streak_days, last_active)
   - Missing: legacy fields (board, grade, class, onboardingComplete, savedBooks)
   - Missing: linked_children, parent_id (parent functionality)
   - Missing: subscription embedded document (plan, status, expires_at, ai_credits_used_today, ai_credits_reset_at)
   - Missing: active_session_token, active_device_fingerprint (session guard)
   - Missing: teacher_profile embedded document
   - Missing indexes: google_id, role, subscription.plan, board+grade

2. **Book Model - MISSING FIELDS**:
   - Missing: board (String), grade (String) denormalized fields
   - Missing: program_id, board_id (uses refs but different structure)
   - Missing: edition_year, edition_label, is_current_edition, previous_edition_id
   - Missing: metadata embedded document (authors, publisher, publication_city, isbn, total_pages, language, script_direction, grade_level, curriculum_year)
   - Missing: seo embedded document
   - Missing: total_chapters, total_topics
   - Missing: ingestion_status, ingestion_log
   - Missing: is_live, original_pdf_url, cover_image_url
   - Missing: created_by, approved_by, approved_at
   - Subject is ENUM (too restrictive vs freeform string in source)
   - Missing indexes

3. **Ingestion Service - MAJOR REGRESSION**:
   - Target uses simplified ingestBook/ingestChapter/ingestTopic functions
   - MISSING: Program/Board upsert logic
   - MISSING: Edition handling (edition_year, is_current_edition, previous_edition_id)
   - MISSING: Content hash-based deduplication
   - MISSING: Key terms normalization
   - MISSING: Raw text/clean_html concatenation from content_blocks
   - MISSING: Version control (version_status, previous_version_id)
   - MISSING: Exam frequency tracking
   - MISSING: Workflow status management
   - The target ingestion is a SIMPLIFIED shell that won't work with the DeepSeek JSON schema from source

4. **Auth Service - DIFFERENT APPROACH**:
   - Source: NextAuth-based with JWT tokens via NextAuth session
   - Target: Standalone JWT with access+refresh tokens
   - This is ACCEPTABLE for standalone backend BUT missing:
     - No OTP verification flow
     - No password reset flow
     - No email verification flow
     - Google OAuth flow incomplete (needs proper callback handling)

5. **Missing Models in Target** (need to verify existence):
   - Check if all 13 models exist in target

6. **API Response Format - INCONSISTENT**:
   - Source: { success: boolean, data?: any, error?: string }
   - Target: { success: true, message, data } OR { success: false, error: { code, message, details } }
   - Target format is MORE verbose but acceptable

### Step 1.4 - Modern Structure Check

#### Express 5.x Compatibility:
- Target uses Express but needs verification for:
  - Async error propagation (Express 5 handles async natively)
  - Route handler signatures
  - CORS configuration looks correct
  - Helmet usage correct

#### Mongoose 8.x/9.x Compatibility:
- Target models use modern syntax
- No deprecated APIs detected at first glance

#### ESM/CJS Consistency:
- Target uses ESM (import/export) - GOOD
- All files use .js extension with explicit imports - GOOD

#### Environment Validation:
- Target uses Zod for env validation - EXCELLENT
- Proper error messages on validation failure

#### Security:
- Helmet configured (contentSecurityPolicy disabled for dev - acceptable)
- CORS configured for both origins - GOOD
- Rate limiting middleware exists - need to verify implementation

### Step 1.5 - Fixes Required

#### Priority 1 - CRITICAL:
1. Fix User model to include ALL source fields
2. Fix Book model to include ALL source fields  
3. Rewrite ingestion service to match source IngestionEngine.ts logic
4. Add missing models if not present

#### Priority 2 - HIGH:
5. Add OTP/password reset flows to auth
6. Add session guard fields to User
7. Add student_profile embedded document
8. Add subscription embedded document

#### Priority 3 - MEDIUM:
9. Add all missing indexes
10. Ensure API response format consistency
11. Verify all 13 models exist and are complete

### Step 1.6 - Backend Tests

Location: `/mnt/oss/qwen-workspace/audit-output/backend-tests/`
Test files needed:
- auth.test.js
- books.test.js
- ingestion.test.js (CRITICAL)
- topics.test.js
- progress.test.js
- vault.test.js
- quiz.test.js
- ai.test.js
- search.test.js

---

## PHASE 2: FRONTEND AUDIT

Status: NOT YET STARTED - Will begin after backend fixes complete

---

## NEXT ACTIONS

1. Read remaining target models to confirm which exist
2. Compare each model field-by-field
3. Write fixes to target backend
4. Create backend test suite
5. Move to frontend audit
