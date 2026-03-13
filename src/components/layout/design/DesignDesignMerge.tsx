export function DesignDesignMerge() {
    return (
        <div className="p-4 space-y-4">
            <p className="text-sm text-zinc-500">
                Fai il merge di un altro Design nel progetto corrente. Tutti i suoi children verranno estratti e iniettati nella root locale.
            </p>
            {/* TODO: Implement remote recursive fetch designs/{id}/objects/* and insertion logic */}
        </div>
    );
}
