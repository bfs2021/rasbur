import LegalPage from '@/components/LegalPage.js';

export default function TermsPage() {
    return (
        <LegalPage
            title="Terms of use"
            lastUpdated="October 29, 2026"
            intro="This website exists to show what Rasbur does. The hosted workspace and its API are a free demo, not a service to depend on. For real use, install the npm package or run the MCP server, which are covered by the MIT license rather than these terms."
            sections={[
                {
                    heading: 'A demo, not a service',
                    body: (
                        <p>
                            The workspace runs on free-tier hosting, maintained by one person. It
                            can be slow, rate limited, or unavailable without notice, and it may be
                            shut down. There is no uptime commitment.
                        </p>
                    ),
                },
                {
                    heading: 'Saved data',
                    body: (
                        <p>
                            Saved history, share links and API keys are kept on a best-effort basis,
                            with no backups, and may be lost. Keep your own copy of anything you
                            need.
                        </p>
                    ),
                },
                {
                    heading: 'Software and results',
                    body: (
                        <p>
                            Rasbur detects and decodes encoded strings. Results are best effort and
                            may be incorrect. Verify important output before relying on it.
                        </p>
                    ),
                },
                {
                    heading: 'Your account and keys',
                    body: (
                        <p>
                            Keep account credentials and API keys private. Revoke a key promptly if
                            it is exposed. You are responsible for activity performed with your
                            account or keys.
                        </p>
                    ),
                },
                {
                    heading: 'Acceptable use',
                    body: (
                        <ul>
                            <li>
                                Use Rasbur only with data and systems you are allowed to inspect.
                            </li>
                            <li>
                                Do not disrupt the workspace or attempt to access other users&apos;
                                data.
                            </li>
                            <li>Do not bypass security or rate-limit controls.</li>
                        </ul>
                    ),
                },
                {
                    heading: 'License',
                    body: (
                        <p>
                            Rasbur&apos;s source code is available under the{' '}
                            <a
                                className="pg-link"
                                href="https://github.com/omanshchoudhary/rasbur/blob/main/LICENSE"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                MIT license
                            </a>
                            .
                        </p>
                    ),
                },
            ]}
        />
    );
}
