"use strict";
const MySharedDataConstant = { a: 69, b: 420, c: 'Hello, World!' };
{
    const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
    const _ = isBrowser ? window : global;
    Object.assign(_, { MySharedDataConstant });
}
//# sourceMappingURL=constants.js.map