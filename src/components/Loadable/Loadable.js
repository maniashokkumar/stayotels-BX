import { Suspense } from 'react';
import { Loader } from '../index';

const Loadable = (Component) => (props) =>
(
    <Suspense fallback={<Loader pageLoader={true} pageLoaderCustomStyles={{ background: "transparent" }} />}>
        <Component {...props} />
    </Suspense>
);

export default Loadable;
