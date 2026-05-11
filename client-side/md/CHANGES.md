- The Dashboard Routes needs to be under "/dashboard"
- All buttons will have cursor-pointer
- The Primary font is Inter and Secondary is Ubuntu (Primary for titles and stuff, Secondary for rest): https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap
- The Docs will be directly under "/docs", so it's fine - But it is outside a dashboard scope
- IDK why, but How do I login to Admin dashboard exactly? The role based routing guard is not done yet, is it?
- The Users List in Admin dashboard will be Table list btw, not card.
- --color-bg-card is a bit pink-ish in white mode, it should be gray-ish, not much, but little


Implement with Live Data. Not placeholder. Implement the APIs


USER Dashboard

- /dashboard/apikeys:
The API Key should have more value while showing, now it just looks like a subtitle. and the copy button should be beside / with it.
The menu button on the card is changing active status of the API instead of showing options popover
The Settings button is giving "Delete" prompt instead of taking to the settings page.

- /dashboard/providers:
User should be able to look at the models under the providers.
Maybe the backend forgot, but there will be a "bestFor" array of strings which will have some features.

- /dashboard/keys:
make it grid-col-2 cards. 1 col is too long

[OVERALL] : Needs skeletons for all card / lists





- /dashboard/apikeys

The Settings should open Api Key settings (There is a route for that, and other routes for provider selections, model selections, etc)

## API Keys (Core System)

This is the MOST COMPLEX part of the user dashboard.

The API Key settings page is deeply configurable.

You MUST plan:

- Complex settings UX
- Progressive disclosure UX
- Advanced settings sections
- Multi-provider selection UX
- Model selection UX
- Provider-specific configuration UI
- Expandable configuration groups
- Dynamic forms
- Validation architecture
- Nested settings behavior
- Performance handling for large configs
- State persistence
- Save/discard workflows
- Unsaved changes handling
- Version/future extensibility planning

This page should feel enterprise-grade.


#### API Keys Endpoints

- `GET /api/iv1/apikeys` — List API keys with stats
- `POST /api/iv1/apikeys` — Create API key
- `GET /api/iv1/apikeys/:id` — API key detail (providers, models, stats)
- `PATCH /api/iv1/apikeys/:id` — Update API key (name, active)
- `PATCH /api/iv1/apikeys/:id/settings` — Update settings (maxIterations, roundhouseMethod)
- `PATCH /api/iv1/apikeys/:id/status` — Toggle active
- `DELETE /api/iv1/apikeys/:id` — Delete API key
- `POST /api/iv1/apikeys/:id/providers/:providerId` — Select provider (with apiKeysManagerIds)
- `DELETE /api/iv1/apikeys/:id/selections/:selectionId` — Remove provider selection
- `PATCH /api/iv1/apikeys/:id/providers/:providerId/models` — Select models
- `DELETE /api/iv1/apikeys/:id/providers/:providerId/models` — Deselect models
- `PATCH /api/iv1/apikeys/:id/providers/:providerId/status` — Toggle provider selection active
- `PATCH /api/iv1/apikeys/:id/models/:modelId/status` — Toggle model selection active
- `GET /api/iv1/apikeys/:id/models` — All model selections with priority
- `PATCH /api/iv1/apikeys/:id/models/priority` — Reorder model priorities

You can check `server-side` to get the api body and response structure.



- /dashboard/providers
Maybe Use popup to view the models, instead of creating dropdowns like that

After adding new Key in vault. It shows success AND error toast (/dashboard/keys)

Same with when creating ApiKey (/dashboard/apikeys)

Same with when creating custom provider (/dashboard/providers)

- /dashboard/providers
Here should be 2 sections. The upper section will hold User created providers, the below section will hold Global providers.
And the User providers should have models creation for that particular provider too. I already provided that to you



- /dashboard/apikeys/:id

In the Model Priority section, don't let user to enter number, instead do a drag and drop kind of update.
And don't update right then and there, add a "Save changes" button for the db call
the API already takes the list as request body::
{
    items: {
        modelSelectionId: string;
        priority: number;
    }[];
}