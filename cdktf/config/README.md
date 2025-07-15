# Configuration Files

This directory contains environment-specific configuration files.

## Setup

1. Copy the example file for your environment:

   ```bash
   cp dev.ts.example dev.ts
   ```

2. Edit the configuration file with your actual values:
   ```bash
   vi dev.ts
   ```

## File Format

The configuration files use TypeScript format with the following structure:

```typescript
export const cdnConfig = {
  domainName: "your-actual-domain.com",
  aliases: ["your-cloudfront-alias.com"],
  certificateConfig: {
    cloudfront_default_certificate: false,
    minimum_protocol_version: "TLSv1.2_2021",
    ssl_support_method: "sni-only",
    acm_certificate_arn:
      "arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_CERT_ID",
  },
} as const;
```

## TypeScript Benefits

- **Type Safety**: コンパイル時に型チェック
- **IntelliSense**: IDE での自動補完とエラー検出
- **Comments**: 設定項目にコメントを記述可能
- **Constants**: `as const` で型を厳密に指定

## Security

- **Never commit actual configuration files to the repository**
- Only commit `.example` files with dummy values
- Add `*.ts` to `.gitignore` to prevent accidental commits
