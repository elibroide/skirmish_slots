declare module 'react-fitty' {
    import * as React from 'react';
    export interface ReactFittyProps {
        children?: React.ReactNode;
        minSize?: number;
        maxSize?: number;
        wrapMultiLine?: boolean;
    }
    export class ReactFitty extends React.Component<ReactFittyProps> {}
}
