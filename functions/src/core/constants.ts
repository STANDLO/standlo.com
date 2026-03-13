export const systemLocales = [
    // North America & Fallback
    { code: "us", nativeLabel: "United States", flag: "🇺🇸" },
    //{ code: "mx", nativeLabel: "México", flag: "🇲🇽" },
    
    // South America
    //{ code: "ar", nativeLabel: "Argentina", flag: "🇦🇷" },
    //{ code: "br", nativeLabel: "Brasil", flag: "🇧🇷" },

    // Middle East & Asia
    { code: "ae", nativeLabel: "الإمارات العربية المتحدة", flag: "🇦🇪" },
    { code: "cn", nativeLabel: "中国", flag: "🇨🇳" },
    //{ code: "tr", nativeLabel: "Türkiye", flag: "🇹🇷" },
    //{ code: "in", nativeLabel: "India", flag: "🇮🇳" },
    { code: "jp", nativeLabel: "日本", flag: "🇯🇵" },
    //{ code: "id", nativeLabel: "Indonesia", flag: "🇮🇩" },
    //{ code: "my", nativeLabel: "Malaysia", flag: "🇲🇾" },
    //{ code: "th", nativeLabel: "ประเทศไทย", flag: "🇹🇭" },
    
    // Oceania
    { code: "au", nativeLabel: "Australia", flag: "🇦🇺" },

    // Europe (UK + EU27)
    { code: "gb", nativeLabel: "United Kingdom", flag: "🇬🇧" },
    //{ code: "at", nativeLabel: "Österreich", flag: "🇦🇹" },
    { code: "be", nativeLabel: "België / Belgique", flag: "🇧🇪" },
    //{ code: "bg", nativeLabel: "България", flag: "🇧🇬" },
    //{ code: "cy", nativeLabel: "Κύπρος", flag: "🇨🇾" },
    //{ code: "cz", nativeLabel: "Česko", flag: "🇨🇿" },
    { code: "de", nativeLabel: "Deutschland", flag: "🇩🇪" },
    { code: "dk", nativeLabel: "Danmark", flag: "🇩🇰" },
    //{ code: "ee", nativeLabel: "Eesti", flag: "🇪🇪" },
    { code: "es", nativeLabel: "España", flag: "🇪🇸" },
    //{ code: "fi", nativeLabel: "Suomi", flag: "🇫🇮" },
    { code: "fr", nativeLabel: "France", flag: "🇫🇷" },
    //{ code: "gr", nativeLabel: "Ελλάδα", flag: "🇬🇷" },
    //{ code: "hr", nativeLabel: "Hrvatska", flag: "🇭🇷" },
    //{ code: "hu", nativeLabel: "Magyarország", flag: "🇭🇺" },
    //{ code: "ie", nativeLabel: "Ireland", flag: "🇮🇪" },
    { code: "it", nativeLabel: "Italia", flag: "🇮🇹" },
    //{ code: "lt", nativeLabel: "Lietuva", flag: "🇱🇹" },
    //{ code: "lu", nativeLabel: "Luxembourg", flag: "🇱🇺" },
    //{ code: "lv", nativeLabel: "Latvija", flag: "🇱🇻" },
    //{ code: "mt", nativeLabel: "Malta", flag: "🇲🇹" },
    { code: "nl", nativeLabel: "Nederland", flag: "🇳🇱" },
    //{ code: "pl", nativeLabel: "Polska", flag: "🇵🇱" },
    //{ code: "pt", nativeLabel: "Portugal", flag: "🇵🇹" },
    //{ code: "ro", nativeLabel: "România", flag: "🇷🇴" },
    //{ code: "se", nativeLabel: "Sverige", flag: "🇸🇪" },
    //{ code: "si", nativeLabel: "Slovenija", flag: "🇸🇮" },
    //{ code: "sk", nativeLabel: "Slovensko", flag: "🇸🇰" },
];

export const systemUiModes = [
    { code: "home", nativeLabel: "Home Page", icon: "Home", color: "transparent" },
    { code: "tools", nativeLabel: "Tools Dashboard", icon: "LayoutDashboard", color: "blue" },
    { code: "design", nativeLabel: "3D Design", icon: "Box", color: "green" },
];

export const euLocales = [
    "at", "be", "bg", "cy", "cz", "de", "dk", "ee", "el", "es", "fi", "fr", "gr", "hr", "hu", "ie", "it", "lt", "lu", "lv", "mt", "nl", "pl", "pt", "ro", "se", "si", "sk", "xi"
];

export const DesignTools = {
    SKETCH: {
        id: "sketch",
        name: "tools.sketch",
        icon: "BoxSelect", 
        defaultColor: "green",
        isVolumetric: true,
        description: "tools.sketchDesc",
        group: "add",
        mobile: false,
        active: true
    },
    PART: {
        id: "part",
        name: "tools.part",
        icon: "Box",
        defaultColor: "blue",
        isVolumetric: false,
        description: "tools.partDesc",
        group: "add",
        mobile: false,
        active: true
    },
    ASSEMBLY: {
        id: "assembly",
        name: "tools.assembly",
        icon: "Boxes",
        defaultColor: "purple",
        isVolumetric: false,
        description: "tools.assemblyDesc",
        group: "add",
        mobile: false,
        active: true
    },
    BUNDLE: {
        id: "bundle",
        name: "tools.bundle",
        icon: "Layers",
        defaultColor: "orange",
        isVolumetric: false,
        description: "tools.bundleDesc",
        group: "add",
        mobile: false,
        active: true
    },
    DESIGN: {
        id: "design",
        name: "tools.design",
        icon: "Building2",
        defaultColor: "teal",
        isVolumetric: false,
        description: "tools.designDesc",
        group: "add",
        mobile: true,
        active: true
    }
} as const;
