import LegalPage from '@/components/LegalPage.js';

export default function PrivacyPage() {
    return (
        <LegalPage
            title="Privacy policy"
            lastUpdated="October 29, 2026"
            intro="Rasbur is open-source decoding software. The npm packages run on your own machine and send nothing anywhere. This policy covers the hosted workspace, which sends what you decode to the Rasbur API."
            sections={[
                {
                    heading: 'Account data',
                    body: (
                        <p>
                            If you sign in with Google or GitHub, the workspace receives your name,
                            email address, and avatar from that provider. It does not receive or
                            store your password.
                        </p>
                    ),
                },
                {
                    heading: 'Decode data',
                    body: (
                        <p>
                            The workspace sends each input to the Rasbur API to decode it. Inputs
                            are not stored, and request logs record only the method, path, status
                            and timing, never the input itself. An input is stored only if you save
                            it to your history or create a share link. Anyone with a share link can
                            see the result until the link expires. Links created from the workspace
                            expire after 30 days.
                        </p>
                    ),
                },
                {
                    heading: 'Usage limits',
                    body: (
                        <p>
                            To enforce daily decode limits, the API counts requests against your IP
                            address when you are signed out, and against your account when you are
                            signed in. The counts reset each day.
                        </p>
                    ),
                },
                {
                    heading: 'Local storage',
                    body: (
                        <p>
                            The workspace uses browser local storage for your sign-in tokens and for
                            the page to return to after signing in. It does not use advertising or
                            tracking cookies, and it runs no analytics.
                        </p>
                    ),
                },
                {
                    heading: 'Open source',
                    body: (
                        <p>
                            Rasbur is released under the MIT license. Its source is available on{' '}
                            <a
                                className="pg-link"
                                href="https://github.com/omanshchoudhary/rasbur"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                GitHub
                            </a>
                            .
                        </p>
                    ),
                },
            ]}
        />
    );
}
