import { ContentScriptContext } from "api/types";
import v5FormattingBar from "./v5/formattingBar";

const initFormattingBar = (context: ContentScriptContext, cm: any) => {
    if (cm.cm6) {
        // See taskAndHeaderRenderer: importing CM6 extensions causes the
        // whole content script to fail in Joplin's sandbox.
        return;
    }

    v5FormattingBar(context, cm);
};

export default initFormattingBar;
