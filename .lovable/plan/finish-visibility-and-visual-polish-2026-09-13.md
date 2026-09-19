# Finish visibility and visual polish

## What will change
- Complete grade-and-section visibility across post creation, editing, reading, account settings, and student sign-up.
- Preserve all existing posting, authentication, and permission behavior while saving the selected grade-and-section combinations correctly.
- Add forest green as the restrained accent and gradient color across primary actions and key emphasis.
- Make the literary background pattern more visible without reducing readability.
- Increase the size and clarity of essential controls, especially the home sign-in action, primary buttons, inputs, headings, and account actions.
- Keep the Bodoni/Helvetica hierarchy consistent and retain the softer rounded visual language.

## Validation
- Check every page for errors.
- Test the public home and sign-in screens at desktop and mobile sizes.
- Verify post access controls show grades and sections clearly and submit the expected combinations.

## Technical details
- Use existing semantic color tokens and shared controls rather than page-specific colors.
- Generate permission rows as the cross-product of selected grades and sections.
- De-duplicate permission values when loading existing posts.
- Add page-specific metadata where missing while leaving application logic unchanged beyond the requested section support.
