# AI Feature Cost Estimation & Subscription Model Proposal

This document outlines the potential costs associated with the new AI-powered "Product Scanner" feature and proposes a subscription model to cover these costs while generating a profit margin.

## Cost Driver: Google Gemini API

The primary cost for this feature comes from calls to the Google Gemini API, specifically the `gemini-pro-vision` model which is used to analyze images.

### Gemini API Pricing (as of latest data)

-   **Gemini Pro Vision**: `$0.0025` per 1,000 characters of input + `$0.0025` per image.

*Note: Prices are subject to change by Google. Please refer to the official Google Cloud AI pricing page for the most up-to-date information.*

### Cost Per Scan Calculation

Each "scan" in the app involves one API call with one image and a text prompt.

-   **Image Cost**: $0.0025 per scan
-   **Prompt Cost**: The text prompt is small (approx. 500 characters), so the cost is negligible (around $0.00000125).
-   **Output Cost**: The generated description is also small.

**Therefore, we can estimate the cost per scan to be slightly above $0.0025.**

For simplicity, let's round up and use an estimated **cost of $0.003 per scan** to be safe and account for minor variations.

## Proposed Subscription Tiers

To make this feature sustainable and profitable, we can introduce the following monthly subscription tiers for customers.

### Tier 1: Basic Scanner

-   **Price**: $2.99 / month
-   **Scans Included**: 100 scans per month
-   **Cost to Us**: 100 scans * $0.003/scan = $0.30
-   **Gross Margin**: $2.99 - $0.30 = $2.69 per user/month

### Tier 2: Pro Scanner

-   **Price**: $5.99 / month
-   **Scans Included**: 300 scans per month
-   **Cost to Us**: 300 scans * $0.003/scan = $0.90
-   **Gross Margin**: $5.99 - $0.90 = $5.09 per user/month

### Tier 3: Power User

-   **Price**: $9.99 / month
-   **Scans Included**: 1000 scans per month
-   **Cost to Us**: 1000 scans * $0.003/scan = $3.00
-   **Gross Margin**: $9.99 - $3.00 = $6.99 per user/month

## Conclusion

This subscription model provides significant value to the user with a powerful AI feature while ensuring that the operational costs are covered and the app remains profitable. The tiers are designed to cater to different levels of user engagement.

It is recommended to implement a system to track API usage per user to monitor costs and enforce tier limits.
