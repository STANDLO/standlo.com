export default function DesignerDashboardPage() {
    return (
        <div className="ui-dashboard-wrapper">
            <div className="ui-dashboard-header">
                <h1 className="ui-dashboard-title !text-indigo-600">Design Studio</h1>
                <p className="ui-dashboard-subtitle">
                    Visualizza le richieste di progettazione e i brief dei clienti Standlo.
                </p>
            </div>

            <div className="ui-dashboard-grid-2">
                <div className="ui-dashboard-card border-l-4 border-l-indigo-600">
                    <h3 className="ui-dashboard-card-title">Nuovi Brief</h3>
                    <div className="ui-dashboard-card-value">3</div>
                </div>
            </div>
        </div>
    );
}
