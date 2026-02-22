export default function ManagerDashboardPage() {

    return (
        <div className="ui-dashboard-wrapper">
            <div className="ui-dashboard-header">
                <h1 className="ui-dashboard-title">Manager Ops</h1>
                <p className="ui-dashboard-subtitle">
                    Supervisiona le operation, gestisci i progetti complessi e monitora il workflow dei partner.
                </p>
            </div>

            <div className="ui-dashboard-grid-4">
                <div className="ui-dashboard-card">
                    <h3 className="ui-dashboard-card-title">Progetti Attivi</h3>
                    <div className="ui-dashboard-card-value">12</div>
                </div>

                <div className="ui-dashboard-card">
                    <h3 className="ui-dashboard-card-title">Da Fatturare</h3>
                    <div className="ui-dashboard-card-value text-destructive">4</div>
                </div>
            </div>
        </div>
    );
}
