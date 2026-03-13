import pkg from "../../../../package.json";

export function BaseVersion() {

    return (
        <div className="ui-base-version">
            STANDLO v. <strong>{pkg.version}</strong> by Kalex AI Inc.
        </div>
    );
}
