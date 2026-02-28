/**
 * Category Guard — validates AI-generated question category/subcategory IDs
 * against the allowed set selected by the user.
 *
 * Runs client-side as a post-validation layer (primary enforcement is server-side).
 * NEVER logs PII or prompt content.
 */

export interface AllowedSubcategory {
  id: string;
  category_id: string;
}

export interface CategoryValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate that a question's category_id and subcategory_id are within allowed sets
 * and that the subcategory belongs to the correct parent category.
 */
export function validateQuestionCategory(
  question: { category_id?: string | null; subcategory_id?: string | null },
  allowedCategoryIds: string[],
  allowedSubcategories: AllowedSubcategory[],
): CategoryValidationResult {
  const errors: string[] = [];

  // If no categories were selected, skip validation
  if (allowedCategoryIds.length === 0) {
    return { isValid: true, errors };
  }

  // 1. category_id must be present
  if (!question.category_id) {
    errors.push('Missing category_id');
    return { isValid: false, errors };
  }

  // 2. category_id must be in allowed set
  if (!allowedCategoryIds.includes(question.category_id)) {
    errors.push(`category_id not in allowed set`);
  }

  // 3. If subcategories were selected, subcategory_id must be present and valid
  if (allowedSubcategories.length > 0) {
    if (!question.subcategory_id) {
      errors.push('Missing subcategory_id when subcategories are required');
    } else {
      const sub = allowedSubcategories.find(s => s.id === question.subcategory_id);
      if (!sub) {
        errors.push(`subcategory_id not in allowed set`);
      } else if (sub.category_id !== question.category_id) {
        errors.push(`subcategory belongs to different category`);
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate all questions in a batch.
 * Returns per-question results and an overall summary.
 */
export function validateBatchCategories(
  questions: Array<{ category_id?: string | null; subcategory_id?: string | null }>,
  allowedCategoryIds: string[],
  allowedSubcategories: AllowedSubcategory[],
): { allValid: boolean; invalidCount: number; results: CategoryValidationResult[] } {
  const results = questions.map(q =>
    validateQuestionCategory(q, allowedCategoryIds, allowedSubcategories),
  );
  const invalidCount = results.filter(r => !r.isValid).length;
  return { allValid: invalidCount === 0, invalidCount, results };
}
