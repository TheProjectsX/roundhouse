## User API Instructions - Focused on Frontend.
Your goal is to create robust route modules for this NestJS project. Only update the modules that needs to be used. Below is given the proposed routes that to be used. Based on the `schema.prisma`, you may change some routes

### Base: `/api/iv-1` - Internal Version 1

### Routes proposal:

* /auth
    - /register
    - /login
    - /change-password

* /providers - list of providers from db with filter capabilities
    - /custom [POST] - Create custom provider for that user
    - /:id [DELETE] - Delete a provider and it's models [Validation: Only custom providers are modifiable]
    - /:id/models - list of models of that provider
    - /:id/models [POST] - Add models for a provider [Validation: Only custom providers are modifiable]
    - /:id/models/:id [DELETE] - Delete a model [Validation: Only custom providers are modifiable]

* /apikeys - list current user's api keys
    - / [POST] - Create new API Key
    - / [PATCH] - Update Api key - along with status
    - /:id - Detailed data including Providers selected, Models Selected of those providers
    - /:id [DELETE] - Delete a certain api key
    - /:id/providers/:id [POST] - Select provider for that api key with auto selecting the models of the provider
    - /:id/providers/:id [DELETE] - Deselect / remove an provider for that api key
    - /:id/providers/:id/toggle-active [PATCH] - Toggle Active deactive of an provider
    - /:id/models/:id [PATCH] - Toggle Active deactive of an model
 

* /admin
    - /login
    - /providers - List Providers along with their models. There will be option to filter to only custom user providers (default being global providers)
        - / [POST] - Create provider
        - / [PATCH] - Update provider - along with status
        - /:id [DELETE] - Delete providers
        - /:id/models - List models of that provider
        - /:id/models [POST] - Create models for that provider
        - /:id/models/:id [PATCH] - Update model - along with status 
        - /:id/models/:id [DELETE] - Delete model

    - /users - Users list with their usage , apikeys and basic data
    - /users/.... [POST | PATCH | DELETE] - Admin power to control user contents including account, providers etc
    
    - /analytics + /analytics/... - Full analytics of usage, users, models, providers, limitations, runtimes, etc etc etc


### Structure:
- *.service.ts - Having the service functions.
    - Parameter structure: { ...., user: UserPayload }
    - Return structure: { message, data?, pagination?  }

- *.controller.ts - Having the controller functions.
    - Parameter structure: For Exact custom req fields, use ReqField decorator: { @ReqField("user") user: UserPayload  }
    - Return structure:  ResponseService.formatResponse({ statusCode, message[Even if returned by service, write here. Unless it's dynamic], data?: result.data, pagination?: result.pagination  })
    - NEVER return `result` directly in `data`
    - `result` = response from service


### Note:
- ALL GET List requests will be handled using QueryBuilder
- All route will be guarded with guards under `/api/iv-1`
- Bearer Authorization
- Use prismaService in `prisma` variable, not `prismaService` variable
- You can follow already created `auth` and `profile` module to get an Idea
- DO NOT touch codes you are not needed to update
- Try to use modular approach when there are too much nested routes (For example: `/admin`)