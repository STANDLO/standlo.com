export default function CustomerDashboardPage() {

    return (
        <div className="ui-dashboard-wrapper">
            <div className="ui-dashboard-header">
                <h1 className="ui-dashboard-title">Dashboard Cliente</h1>
                <p className="ui-dashboard-subtitle">
                    Benvenuto nel tuo portale operativo STANDLO. Da qui puoi gestire i tuoi eventi, ordini e team.
                </p>
            </div>

            <div className="ui-dashboard-grid-3">
                <div className="ui-dashboard-card">
                    <h3 className="ui-dashboard-card-title">Ordini Attivi</h3>
                    <div className="ui-dashboard-card-value">0</div>
                </div>

                <div className="ui-dashboard-card">
                    <h3 className="ui-dashboard-card-title">Membri Team</h3>
                    <div className="ui-dashboard-card-value">1</div>
                </div>
            </div>
        </div>
    );
}
