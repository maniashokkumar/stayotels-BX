import { useRoutes } from 'react-router-dom';
import MainRoutes from './MainRoutes';
import AuthRoutes from './AuthRoutes';
import SetPasswordRoutes from './SetPasswordRoutes';

const PageNotFound = () => {
    return <div>Not found</div>
}
export default function AppRoutes({ user }) {
    return useRoutes(
        [
            SetPasswordRoutes(),
            MainRoutes(user),
            AuthRoutes(),
            { path: '*', element: <PageNotFound /> }
        ]
    );
}
