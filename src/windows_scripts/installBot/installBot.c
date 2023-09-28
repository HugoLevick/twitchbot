#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <io.h>
#include <windows.h>  // Include Windows.h for CopyFile function

int main() {
    // Check if the .env file exists in the source directory
    if (_access("C:\\Program Files\\twitchbot\\.env", 0) != 0) {
        // Prompt the user for input data and variable names
        char twitchUser[100], dbPass[100], addCustomBot[10], addCustomEmotes[10], botUsername[100], botPassword[150], hypeEmote[100], negativeEmote[100], sadEmote[100];

        printf("Enter your Twitch username: ");
        gets_s(twitchUser, sizeof(twitchUser));

        printf("Enter your MySQL password: ");
        gets_s(dbPass, sizeof(dbPass));

        printf("Do you want to add a custom bot? (Y/N): ");
        gets_s(addCustomBot, sizeof(addCustomBot));

        if (_stricmp(addCustomBot, "Y") == 0 || _stricmp(addCustomBot, "Yes") == 0) {
            printf("Enter your Twitch bot username: ");
            gets_s(botUsername, sizeof(botUsername));

            printf("Enter your Twitch bot code: ");
            gets_s(botPassword, sizeof(botPassword));
        } else {
            // Set default values for bot credentials
            strcpy_s(botUsername, sizeof(botUsername), "tourneybot");
            strcpy_s(botPassword, sizeof(botPassword), "oauth:c013cz4hbrzxjwdepbpvzphxl5nl9a");
        }

        printf("Do you want to add custom emotes? (Y/N): ");
        gets_s(addCustomEmotes, sizeof(addCustomEmotes));

        if (_stricmp(addCustomEmotes, "Y") == 0 || _stricmp(addCustomEmotes, "Yes") == 0) {
            printf("Enter your hype emote (example: KomodoHype): ");
            gets_s(hypeEmote, sizeof(hypeEmote));

            printf("Enter your negative emote (example: Kappa): ");
            gets_s(negativeEmote, sizeof(negativeEmote));

            printf("Enter your sad emote (example: BibleThump): ");
            gets_s(sadEmote, sizeof(sadEmote));
        } else {
            // Set default values for bot credentials
            strcpy_s(hypeEmote, sizeof(hypeEmote), "KomodoHype");
            strcpy_s(negativeEmote, sizeof(negativeEmote), "Kappa");
            strcpy_s(sadEmote, sizeof(sadEmote), "BibleThump");
        }

        // Check if the directory exists, if not, create it
        if (_mkdir("C:\\Program Files\\twitchbot") == 0) {
            printf("Directory created successfully.\n");
        }

        // Create the .env file with the user's input
        FILE* envFile = fopen("C:\\Program Files\\twitchbot\\.env", "w");
        if (envFile != NULL) {
            fprintf(envFile, "TWITCH_USERNAME=\"%s\"\n", twitchUser);
            fprintf(envFile, "MYSQLPASSWORD=\"%s\"\n", dbPass);
            fprintf(envFile, "BOT_USERNAME=\"%s\"\n", botUsername);
            fprintf(envFile, "BOT_PASSWORD=\"%s\"\n", botPassword);
            fprintf(envFile, "HYPE_EMOTE=\"%s\"\n", hypeEmote);
            fprintf(envFile, "NEGATIVE_EMOTE=\"%s\"\n", negativeEmote);
            fprintf(envFile, "SAD_EMOTE=\"%s\"\n", sadEmote);
            fclose(envFile);
            printf(".env file created successfully.\n");
        } else {
            printf("Failed to create .env file.\n");
        }
    }

    system("copy \"C:\\Program Files\\twitchbot\\.env\" .");

    system("cls");

    printf("Installing...\n");
    system("npm i --omit-dev");

    system("cls");

    printf("Installation complete.\n");

    // Pause before returning
    system("pause");
    return 0;
}
