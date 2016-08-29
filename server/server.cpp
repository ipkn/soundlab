#include "crow_all.h"
#include <random>
#include <unordered_map>
#include <mutex>
#include <iostream>
using namespace std::chrono_literals;

std::mt19937 mt(std::chrono::high_resolution_clock::now().time_since_epoch().count());
auto dice = [&](int l, int r) { return std::uniform_int_distribution<int>(l, r)(mt); };

struct User
{
    static int global_id;
    int id;
    double x;
    double y;
    char key_state;
    User() : id(global_id++){ }
};
int User::global_id;

struct Note
{
    int x;
    int y;
    int r;
    std::chrono::high_resolution_clock::time_point life;
    int note; // 26-87
};


int main()
{
    crow::SimpleApp app;

    std::mutex mtx;;
    std::unordered_map<crow::websocket::connection*, std::unique_ptr<User>> users;
    std::vector<Note> notes;

    crow::logger::setLogLevel(crow::LogLevel::Critical);

    CROW_ROUTE(app, "/ws")
        .websocket()
        .onopen([&](crow::websocket::connection& conn){
                std::lock_guard<std::mutex> _(mtx);
                users.emplace(&conn, std::make_unique<User>());
                conn.send_text("[\"i\"," + std::to_string(users[&conn]->id) + "]");
                for(auto& note:notes) 
                {
                    crow::json::wvalue v;
                    v[0] = "n";
                    v[1][0] = note.x;
                    v[1][1] = note.y;
                    v[1][2] = note.r;
                    v[1][3] = std::to_string(std::chrono::duration_cast<std::chrono::milliseconds>(note.life.time_since_epoch()).count());
                    v[1][4] = note.note;
                    conn.send_text(crow::json::dump(v));
                }
            })
        .onclose([&](crow::websocket::connection& conn, const std::string& reason){
                std::lock_guard<std::mutex> _(mtx);
                users.erase(&conn);
                })
        .onmessage([&](crow::websocket::connection& conn, const std::string& data, bool is_binary){
                std::lock_guard<std::mutex> _(mtx);
                auto from_u = users[&conn].get();
                for(auto& u:users)
                    if (is_binary)
                        u.first->send_binary(data);
                    else {
                        if (data[2] == 'o') {
                            if (u.first == &conn)
                                continue;
                            u.first->send_text(data.substr(0,5) + 
                            std::to_string(from_u->id) + ","+data.substr(5));
                        } else if (data[2] == 'b') {
                            u.first->send_text(data.substr(0,5) + 
                            std::to_string(from_u->id) + ","+data.substr(5));
                        } else {
                            u.first->send_text(data);
                        }
                    }
                });

    notes.push_back({dice(150,550), dice(50,450), dice(5,25), std::chrono::high_resolution_clock::now() + std::chrono::milliseconds(dice(10000,60000)), dice(26,87)});
    notes.push_back({dice(150,550), dice(50,450), dice(5,25), std::chrono::high_resolution_clock::now() + std::chrono::milliseconds(dice(10000,60000)), dice(26,87)});
    notes.push_back({dice(150,550), dice(50,450), dice(5,25), std::chrono::high_resolution_clock::now() + std::chrono::milliseconds(dice(10000,60000)), dice(26,87)});

    app.tick(50ms, [&]{
        //std::cout << "tick" << std::endl;
        std::lock_guard<std::mutex> _(mtx);
        int to_remove = 0;
        auto now = std::chrono::high_resolution_clock::now();
        for(int i = 0; i + to_remove < notes.size(); i ++)
        {
            if (now > notes[i].life)
            {
                to_remove++;
                std::swap(notes[i], notes[notes.size() - to_remove]);
                i--;
            }
        }
        notes.erase(notes.end() - to_remove, notes.end());

        if (dice(1,150) == 1 || notes.size() < 6)
        {
            notes.push_back({dice(150,550), dice(50,450), dice(5,25), now + std::chrono::milliseconds(dice(10000,60000)), dice(26,87)});
            {
                auto& note = notes.back();
                for(auto& kv:users)
                {
                    crow::json::wvalue v;
                    v[0] = "n";
                    v[1][0] = note.x;
                    v[1][1] = note.y;
                    v[1][2] = note.r;
                    v[1][3] = std::to_string(std::chrono::duration_cast<std::chrono::milliseconds>(note.life.time_since_epoch()).count());
                    v[1][4] = note.note;
                    kv.first->send_text(crow::json::dump(v));
                }
            }
        }
    });

    crow::mustache::set_base("..");
    CROW_ROUTE(app, "/static/<path>")
	([](const std::string& filename){
        auto page = crow::mustache::load_text("static/" + filename);
        return page;
	 });
    CROW_ROUTE(app, "/")
    ([]{
        auto page = crow::mustache::load_text("index.html");
        return page;
     });

    app.port(40080)
        .multithreaded()
        .run();
}
