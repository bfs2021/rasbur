import LegalPage from '@/components/LegalPage.js';

export default function TermsPage() {
    return (
        <LegalPage
            title="Terms of use"
            lastUpdated="October 29, 2026"
            intro="These terms cover the Rasbur reference workspace and optional API features. The separately published packages are governed by the MIT license."
            sections={[
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
