import openapiSpecRaw from '../public/openapi.json';

export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: {
      name?: string;
      email?: string;
    };
  };
  servers: Array<{ url: string; description?: string }>;
  paths: Record<
    string,
    Record<
      string,
      {
        summary: string;
        description: string;
        tags?: string[];
        security?: boolean | any[];
        parameters?: Array<{
          name: string;
          in: string;
          required: boolean;
          description: string;
          schema?: any;
          type?: string;
        }>;
        requestBody?: {
          required?: boolean;
          content: {
            'application/json': {
              schema: any;
            };
          };
        } | any;
        responses: Record<
          string,
          {
            description: string;
            content?: {
              'application/json': {
                schema: any;
                example?: any;
              };
            };
            example?: any;
          }
        >;
      }
    >
  >;
  components?: {
    securitySchemes?: Record<string, any>;
    schemas?: Record<string, any>;
  };
}

export const openapiSpec = openapiSpecRaw as unknown as OpenApiSpec;
