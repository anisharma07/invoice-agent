import json
import os
from typing import List, Optional, Dict
from collections import Counter


class DataStore:
    """
    DataStore for retrieving relevant SocialCalc templates from the dataset
    Uses keyword matching to find the most relevant template
    """

    def __init__(self):
        """Initialize datastore and load templates"""
        self.templates = {}
        self._load_templates()

    def _load_templates(self):
        """Load templates from invoice_mapping_full.json"""
        try:
            dataset_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                'invoice_mapping_full.json'
            )

            with open(dataset_path, 'r', encoding='utf-8') as f:
                self.templates = json.load(f)

            print(f"Loaded {len(self.templates)} templates from dataset")

        except Exception as e:
            print(f"Error loading templates: {e}")
            self.templates = {}

    def _extract_keywords_from_description(self, description: str) -> List[str]:
        """
        Extract keywords from template description

        Args:
            description: Template description (e.g., "invoice, teal theme, verdana, no borders")

        Returns:
            List of keywords
        """
        # Split by comma and clean up
        keywords = [
            keyword.strip().lower()
            for keyword in description.split(',')
        ]

        # Also split multi-word keywords
        expanded_keywords = []
        for keyword in keywords:
            expanded_keywords.append(keyword)
            # Add individual words from multi-word keywords
            words = keyword.split()
            if len(words) > 1:
                expanded_keywords.extend(words)

        return expanded_keywords

    def _calculate_match_score(
        self,
        template_keywords: List[str],
        query_keywords: List[str]
    ) -> float:
        """
        Calculate match score between template and query keywords

        Args:
            template_keywords: Keywords from template description
            query_keywords: Keywords from user query

        Returns:
            Match score (0-1, higher is better)
        """
        if not query_keywords or not template_keywords:
            return 0.0

        # Count matches
        matches = 0
        total_query_keywords = len(query_keywords)

        for query_kw in query_keywords:
            query_kw_lower = query_kw.lower()
            for template_kw in template_keywords:
                # Check for exact match or substring match
                if (query_kw_lower == template_kw or
                    query_kw_lower in template_kw or
                        template_kw in query_kw_lower):
                    matches += 1
                    break

        # Calculate score
        score = matches / total_query_keywords if total_query_keywords > 0 else 0.0

        return score

    def find_best_match(self, keywords: List[str]) -> Optional[str]:
        """
        Find the best matching template based on keywords

        Args:
            keywords: List of keywords from user query

        Returns:
            SocialCalc code of best matching template or None
        """
        if not keywords or not self.templates:
            return None

        # Clean up keywords
        cleaned_keywords = [kw.lower().strip()
                            for kw in keywords if kw and len(kw) > 2]

        if not cleaned_keywords:
            return None

        print(f"Searching for templates matching keywords: {cleaned_keywords}")

        # Calculate scores for all templates
        scores = {}
        for description, code in self.templates.items():
            template_keywords = self._extract_keywords_from_description(
                description)
            score = self._calculate_match_score(
                template_keywords, cleaned_keywords)

            if score > 0:
                scores[description] = {
                    'score': score,
                    'code': code
                }

        if not scores:
            print("No matching templates found")
            return None

        # Find best match
        best_description = max(scores.keys(), key=lambda k: scores[k]['score'])
        best_score = scores[best_description]['score']

        print(f"Best match: '{best_description}' (score: {best_score:.2f})")

        # Only return if score is reasonable (at least one keyword matched)
        if best_score >= 0.15:  # At least 15% of keywords matched
            return scores[best_description]['code']
        else:
            print(f"Best score {best_score:.2f} too low, not using template")
            return None

    def get_all_templates(self) -> Dict[str, str]:
        """
        Get all templates

        Returns:
            Dictionary of all templates
        """
        return self.templates

    def get_template_by_description(self, description: str) -> Optional[str]:
        """
        Get a specific template by its exact description

        Args:
            description: Exact template description

        Returns:
            SocialCalc code or None
        """
        return self.templates.get(description)
