import pkg from "../../../../package.json";

export function BaseVersion() {

    return (
        <div className="ui-base-version">
            STANDLO v. <b>{pkg.version}</b> | Kalex AI Inc. | All rights reserved.
        </div>
    );
}
