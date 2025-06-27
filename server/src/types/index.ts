import { Request, Response, NextFunction, RequestHandler } from 'express';

export interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        username?: string;
    };
}

export type AuthenticatedHandler = (
    req: AuthenticatedRequest,
    res: Response
) => Promise<any>;

export type AuthenticatedRequestHandler = RequestHandler<any, any, any, any, Record<string, any>>;

export const wrapHandler = (handler: AuthenticatedHandler): AuthenticatedRequestHandler => {
    return (req, res, next) => {
        handler(req as AuthenticatedRequest, res).catch(next);
    };
}; 