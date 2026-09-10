# OpenVPN AuthBatch

OpenVPN AuthBatch streamlines OpenVPN configuration management by embedding `<auth-user-pass>` credentials across multiple `.ovpn` files in one go.

## Features

- **Batch Processing** — Apply a single set of credentials to many config files at once.
- **DNS Overwrite** — Replace all `dhcp-option DNS` entries with servers from well-known providers (Google, Cloudflare, Quad9, OpenDNS, AdGuard) or your own custom addresses.
- **MTU Overwrite** — Strip existing `tun-mtu` directives and set a custom MTU value from common presets or a user-defined number (576–65535).
- **Country Flag Detection** — Prefixes filenames with the matching country flag emoji (from filename tokens or remote hostname).
- **Hostname → IP Resolution** — Resolves hostnames in `remote` lines to IPs via DNS-over-HTTPS and substitutes them in the config.
- **ZIP Download** — Download every modified file in a single archive, each filename tagged with `-mod`.
- **Modern UI** — Responsive, glassmorphism-inspired interface with multilingual support.
- **Open Source** — Pure HTML, CSS, JavaScript and JSZip — no backend required.

Ideal for VPN administrators and power users who need fast, consistent config updates.

## Usage

**Live**  
👉 [https://fevid.github.io/openvpn-authbatch](https://fevid.github.io/openvpn-authbatch)

Or run it locally:

1. Clone the repository
   ```bash
   git clone https://github.com/fevid/openvpn-authbatch.git
   ```
2. Open `index.html` in any modern browser.
3. Upload one or more `.ovpn` files, enter your credentials, and click **Add Auth**.
4. Optionally enable **DNS Overwrite** to swap in your preferred DNS servers and **MTU Overwrite** to tune the tunnel MTU.
5. Download the results individually or as a complete ZIP archive.

## Disclaimer

This tool embeds authentication credentials directly inside the configuration files. Do not share the resulting files with unauthorized parties.

## Other Projects

- [WireGuard DPI Circumvention Converter](https://github.com/fevid/wireguard-dpi-circumvention-converter)

## 💸 Support

Even small amounts make a difference.

| Network | Address |
| --- | --- |
| BTC | `bc1q8clnx03a4wzcmvt0n9ntk0tj6zx22xzrq2jvhk` |
| ETH | `0xaE5774e34635d76f0B6b9B685b99fA1827fADAEa` |
| LTC | `ltc1qak0ptwlnp7vn76yhryq3u6mflmdcm3s0t6cj60` |
| TON | `UQBVVcD7mRhwXlyJAD2V0OIeDh496_DHhUlMdidS4R6nvn2H` |
| USDT/USDC (TRC20) | `TDcQTV1aJ4SPtw8sft2CvQhmMzS22gaVx1` |
