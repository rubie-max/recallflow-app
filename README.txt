RecallFlow — React local development project

Original Floot source version: 1791012573023
Project: 1c09534f-f4f4-4a85-b62d-bc15b157a939

The active app uses React and TypeScript. src/react contains the original page,
components, styles, and theme helper with local Kokoro integration.
floot-original preserves the fetched source before changes.
source-baseline preserves the single-file app supplied in RecallFlow_latest.zip.
The ZIP had no React source folders; those were recovered directly from Floot.

Install and run with Node 24:
  npm install
  npm run dev
Or use pnpm install and pnpm dev.

The live preview is http://127.0.0.1:5173/.
The server listens only on this PC, rebuilds on source edits, and reloads the
browser after a successful build. The original UI is preserved, with Kokoro
voice and speed settings plus compact speaker buttons in quizzes.

Build for GitHub Pages:
  npm run build
Publish the contents of dist/ as the GitHub Pages site.
All app, worker, model-library, logo, and stylesheet paths are relative, so the
build supports a repository subdirectory. Model files download from Hugging
Face into browser caches, not from this repository. Fonts use Google Fonts.
No backend server or API key is needed for the published app.

Speech:
Kokoro 82M runs in a dedicated browser worker. Automatic mode probes WebGPU and
uses fp32; GPU initialization/inference failure retries Kokoro WASM q8. A forced
WASM option makes compatibility testing explicit. No system speech is used.
Five voices are available: Heart (default), Bella, Michael, Fenrir and Emma. Preview a draft voice/speed in Settings, then click Save voice settings to persist it for quiz speakers. Speeds range from 0.8x to 1.2x. Unsaved changes are discarded on refresh.
Stop audio and navigation cancel playback; stale generations do not auto-play.
Question prompts, flashcard fronts/backs and correct-answer feedback have speakers.
Audio is generated only on request, never automatically for the entire bank.
Generated WAV blobs are stored in IndexedDB (recallflow-kokoro-audio/audio).
Keys include item ID, question/answer role, exact text, voice, speed, processing
mode, model, library version and cache version. Voice changes retain older audio.
Edits get new keys. Deleting a question removes associated audio where storage
is available. Requests deduplicate and inference runs serially; playback is single.
Storage/quota failure still permits playback and memory caching, with a message.
Normal model-library Cache Storage is enabled; cache hits need no model/inference.
Browser storage can be cleared/evicted; these local caches are not cloud backups.
Run node audio-tests.mjs for request/cache/error-path regression checks.

Verification:
react-webgpu-playback.json and react-wasm-playback.json contain browser playing
and ended events, duration, waveform RMS/peak, volume, and mute evidence.
audio-cache-browser-tests.json records all five voices, speed changes, separate question/answer audio, editing, refresh persistence, and a successful quiz export. First Heart playback including download took about 59 seconds; repeat lookup took 10 ms. After refresh, a saved sample took 18 ms with zero inference and no worker. WebGPU and WASM both completed the new 3.8-second preview.
Browser playback proves the media player ran; it does not measure speaker
hardware or provide a subjective listening assessment.

Storage:
The original app stores questions, interval/due metadata, quiz reports, streaks,
and theme in localStorage. These keys are preserved. The local preview cannot
access storage belonging to the Floot domain; no existing Floot browser data was
transferred. The current bundled bank has four demo questions.
Changing browser, device, or site address starts a separate local store.

Additional fixes:
Multiple-choice reports record the chosen answer without a stale state value.
An empty question bank persists correctly and cannot launch an empty quiz.
Deleted demo questions are not silently restored. Imports validate question
types/content before appending entries; React renders text safely.

Hosting status: local live preview only; not published to GitHub yet.

Theme indicator now synchronizes with the saved theme after refresh.
Fill-blank speakers say blank instead of reading underscore punctuation.

Stage 1 (2026-10-04): True/False, Multi-select, Numeric Answer and Retry mistakes.
Retry practice creates a separate report linked by source_report_id; original reports remain intact. Deleted questions are excluded, and current saved versions are used.
Multi-select uses options plus a correctAnswers array in JSON; all correct choices and no extras must be selected. Numeric answers use a finite decimal/scientific number and optional numericTolerance (default 0). True/False uses answer True or False.
Manual editing/importing validate all new types and multiple-choice choices. Existing localStorage keys and default demo bank are unchanged.
Tests: npm test. Browser proof: stage-1-browser-tests.json. Remaining stages: ROADMAP.md.

Expanded Settings (2026-10-04): explicit voice/speed saving with confirmation;
quiz length (all questions or a chosen count) and shuffle defaults with Save;
Download data backup and Copy backup JSON; saved-speech usage and confirmed clearing.
Quiz defaults apply to new ordinary quizzes. Retry mistakes includes all available misses.
Backup exports questions, reports, quiz count, streaks, theme and saved preferences.
Full-backup restoration is available in Settings. Generated audio/model files are excluded.
Clearing saved speech removes generated audio only, preserves learning data, and
retains downloaded model files. Future speech regenerates when requested.
Settings are browser-local, with no cloud sync. Proof: settings-browser-tests.json
and settings-backup-test.json. Question, settings and audio tests run with npm test.

Settings design refresh: compact icon headings, quieter secondary actions, shuffle switch, clear save rows, responsive button layouts and visible keyboard focus. Voice, quiz and storage behavior is preserved.

Quiz design refresh: readable question typography, larger answer choices, correct/incorrect choice highlighting, stacked feedback and Next question/See results actions. Flashcards retain flip/self-grading controls. Tested typed answers, fill blanks, multiple choice and flashcards in light/wide and dark/narrow previews.

Question library refresh: prompt-focused cards with expandable answers, text search across questions/answers/subjects/topics, combined type and subject filters, reset/empty results states, and inline delete confirmation. Search/filtering does not change the saved bank. Browser verification: questions-library-tests.json.

Chosen quiz layout: B on desktop (side-by-side question and answer panels, breakpoint 820px) and B1 on mobile (stacked cards). Multiple-choice and True/False now select first and submit with Check answer. Native radio controls support keyboard navigation; multi-select retains explicit submission. Kokoro, flashcard self-grading, numeric tolerance, reports and retry behavior remain. B1-browser-tests.json verifies all seven types, recorded choice, and completed browser audio.

Voice polish (2026-10-04): draft voice/speed with Save and Cancel, unsaved-change
indicator, and one contextual Preview/Stop button. Leaving Settings or refreshing
restores saved preferences. Existing saved voice/speed remain unchanged.
Voice cache sits directly below speech settings and updates after generation or
clearing. Confirmed clearing releases generated clips and preserves study data,
preferences and downloaded model files. Compatibility details are collapsed.
Quiz speakers show generation/playback status, stop on a second tap and switch
playback without overlapping audio. Flashcard flips never auto-play speech.
All 18 requested browser checks passed: voice-polish-browser-tests.json.
Before/after QA backups confirm study data preservation during cache clearing.

Learning features (2026-10-04):
- Local PNG/JPEG/WebP image prompts and answer choices (2 MB per image).
  Images are embedded in question JSON, remain offline and travel with backups.
- Matching: pairs [{left,right}]; Ordering: sequence [steps in correct order].
- Cloze: prompt with ___ markers and blanks [answers in marker order].
- Text acceptedAnswers [alternatives]; fuzzy false disables typo acceptance.
  One edit is accepted only for words of at least five characters with no digits.
  This is conservative typo detection, not semantic/AI grading.
- Quiz builder: Daily, Due, All; count, subject, topic, types, shuffle and weak/mistake focus.
  Daily selects due/new questions with older due dates first. Due selects due/new
  questions. All allows practice regardless of schedule. Correct intervals grow
  by 2.2x, from 1 day to a maximum 365; wrong answers become due today.
- Reports include grading category and response times. Insights group accuracy
  by subject/topic/type, show the last twelve reports and repeated mistakes.
- Library tags, sorting and normalized prompt/answer/type duplicate detection.
- Full backup review/restore validates data before replacement, preserves the
  unrelated storage and rolls back writes if browser storage is full.
- Installable manifest and service worker cache the local app shell and icons.
  Open online once before offline study. Installation depends on browser support.

Personal login postponed until the app is finished. The temporary browser lock
and its Settings controls have been removed. Final hosting should use a secure
single-owner server login, with credentials held in private server configuration,
no signup or password-changing UI, and no study-data sync unless requested.

Verification: learning-tests.mjs covers grading, schedule, filters, analytics,
backup validation/restore and quota rollback. learning-features-browser-tests.json
records real matching/order/cloze quizzes, images, typo/alternative answers, due
and weak filters, editor image upload, report analytics, backup round trip, and
offline reload/quiz/report persistence with the isolated server stopped. Existing
question/settings/audio regression tests pass. No TTS changes in this increment.

Mobile quiz refresh: one continuous question/answer surface, compact metadata,
large readable controls, a fixed bottom action with safe-area padding, two-column
image choices and cloze inputs, compact matching rows and sequence controls.
Phone quizzes return to the top on the next question and bring feedback into view.
All 11 sample layouts passed at 390x844 without horizontal overflow; every sample
was answered correctly in an isolated browser quiz. See mobile-quiz-layout-tests.json.

Matching and sentence blanks: matching now uses tap-to-connect left/right tiles,
numbered pairs and SVG connecting lines, one-to-one reassignment, reset and graded
colors. Single fill-blank and multi-blank/cloze inputs appear in the original
sentence. Existing answers, grading and import fields are unchanged. Browser
proof: matching-and-inline-blanks-browser-tests.json; three-question quiz passed.

New separate type: fill_blank_options (Fill blanks with options). Use ___ markers,
a blanks array with the correct answers in marker order, and an options array
containing every correct answer plus optional distractors. Options may be reused
across gaps. The UI selects a gap, fills it from the word bank and permits clearing
or changing it before checking. Exact ordered answers are graded; this type has
its own filters and analytics label. Both one/multiple-gap samples and manual
authoring passed browser tests. See word-bank-tests.mjs and word-bank-browser-tests.json.

Settings voice previews now use five bundled prerecorded WAV samples in public/voice-previews/. No model loading or TTS inference occurs for previews, including first use. Speed uses pitch-preserving playbackRate. Samples are precached with the offline app and are separate from the generated speech cache. Heart remains the default for new users; saved preferences remain editable. Development-only sample builder: tools/build-voice-samples.mjs. GitHub publication has not been updated for this change.
Saved voice and speed are always shown. Save is disabled until either selection changes; saving/reverting/canceling disables it again. Tested all five prerecorded samples, speed changes, reloads, cache count independence, saved preference persistence and cancel in the browser.

Streak page refreshed: readable current streak, longest/total study days, weekly progress, month calendar with navigation, completed-today status and quiz action. Current streak is no longer capped at seven days. streak-tests.mjs covers long streaks, grace period, gaps, invalid/future dates, duplicates and leap days. Browser checks: 320/390px, light/dark, 12-day fixture, month navigation and quiz controls. Existing study data was preserved; GitHub remains unchanged.
