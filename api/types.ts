export interface EventData {
    event: any;
    timestamp: string;
    headers: {
        'x-forwarded-for'?: string;
        'x-real-ip'?: string;
        'user-agent'?: string;
        'content-type'?: string;
        'content-length'?: string;
        'host'?: string;
        [key: string]: string | undefined;
    };
}