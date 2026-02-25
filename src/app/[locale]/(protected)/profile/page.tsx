import ProfileClient from "./ProfileClient";
import { getApiKeyHint } from "./actions";

export default async function ProfilePage() {
    const res = await getApiKeyHint();

    const initialHint = res.success && res.hint ? res.hint : null;
    const initialCreatedAt = res.success && res.createdAt ? res.createdAt : null;

    return (
        <div className="ui-dashboard-container">
            <div className="ui-dashboard-header">
                <div>
                    <h1 className="ui-dashboard-title">Profilo & Integrazioni API</h1>
                    <p className="ui-dashboard-subtitle">Gestisci le tue credenziali e genera le API Key per l&apos;accesso programmatico.</p>
                </div>
            </div>
            <div className="ui-dashboard-content">
                <ProfileClient initialHint={initialHint} initialCreatedAt={initialCreatedAt} />
            </div>
        </div>
    );
}
