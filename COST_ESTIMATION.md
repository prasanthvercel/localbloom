# AI Feature Cost Estimation & Freemium Model Proposal

This document outlines the potential costs for the AI-powered "Product Scanner" feature and proposes a freemium model that offers initial value for free while encouraging subscriptions for heavier usage.

## Cost Driver: Google Gemini API

The primary cost for this feature comes from calls to the Google Gemini API, specifically the `gemini-pro-vision` model which is used to analyze images.

**Important Note**: The Gemini API is a paid service. While there may be a free tier for initial development, every scan made by your users (including the free ones) will count towards your usage and may incur costs.

### Gemini API Pricing

-   **Gemini Pro Vision**: `$0.0025` per 1,000 characters of input + `$0.0025` per image.

*Note: Prices are subject to change by Google. Please refer to the official Google Cloud AI pricing page for the most up-to-date information. API costs are billed in USD.*

### Cost Per Scan Calculation

Each "scan" involves one API call with one image and a text prompt.

-   **Image Cost**: $0.0025 per scan
-   **Prompt & Output Cost**: The text portion is small, making this cost negligible.

Therefore, we can estimate a safe **cost of $0.003 per scan (USD)**.

## Proposed Freemium & Subscription Model

To attract users and manage costs, we will offer a limited number of free scans per month.

### Free Tier (Customer Acquisition Cost)

-   **Scans Included**: 3 free scans per user, per month.
-   **Cost to Us**: This is a direct cost to the business. If 1,000 users use all their free scans, the monthly cost would be:
    `1,000 users * 3 scans/user * $0.003/scan = $9.00`

This cost is an investment to let users experience the feature's value.

### Proposed Subscription Tiers (For Profitability)

Once a user exhausts their 3 free scans, they will be prompted to subscribe to one of the following paid tiers to continue using the feature.

#### Tier 1: Basic Scanner

-   **Price**: ₹249 / month
-   **Scans Included**: 100 scans per month
-   **Cost to Us**: 100 scans * $0.003/scan = $0.30
-   **Gross Margin**: Approx. ₹224 per user/month (depending on conversion rate)

#### Tier 2: Pro Scanner

-   **Price**: ₹499 / month
-   **Scans Included**: 300 scans per month
-   **Cost to Us**: 300 scans * $0.003/scan = $0.90
-   **Gross Margin**: Approx. ₹424 per user/month (depending on conversion rate)

## Conclusion

This freemium model provides a powerful incentive for users to try the AI scanner, while the subscription tiers ensure that the feature is sustainable and profitable. It's crucial to implement robust tracking of API usage per user to enforce limits and monitor costs effectively.
