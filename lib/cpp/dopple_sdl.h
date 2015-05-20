#pragma once

#include <SDL2/SDL.h>
#include <SDL2/SDL_opengl.h>

namespace dopple
{
	static int SDLEventFilter(void *data, SDL_Event *event)
	{
		switch(event->type)
		{
			case SDL_KEYDOWN:
				//SDL_Log("Key Down %d", event->key.keysym.sym);
				return 0;
				
			case SDL_KEYUP:
				//SDL_Log("Key Up %d", event->key.keysym.sym);
				return 0;
				
			case SDL_MOUSEMOTION:
//				SDL_Log("Mouse moved. X=%d, Y=%d, RelativeX=%d, RelativeY=%d",
//						event->motion.x, event->motion.y,
//						event->motion.xrel, event->motion.yrel);
				return 0;
				
			case SDL_MOUSEBUTTONDOWN:
				//SDL_Log("Mouse Button Down %d", event->button.button);
				return 0;
				
			case SDL_MOUSEBUTTONUP:
				//SDL_Log("Mouse Button Up %d", event->button.button);
				return 0;
				
			case SDL_MOUSEWHEEL:
				//SDL_Log("Mouse Wheel");
				return 0;
		}
		
		return 1;
	}
	
	struct SDLWindow
	{
		SDLWindow(double width, double height)
		{
			if(SDL_Init(SDL_INIT_VIDEO) != 0) {
				printf("SDL could not initialize! SDL_Error: %s\n", SDL_GetError());
				return;
			}
			
			//SDL_LogSetAllPriority(SDL_LOG_PRIORITY_ERROR);
			
			SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_COMPATIBILITY);
			SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 2);
			SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 1);
			
//			SDL_GL_SetAttribute(SDL_GL_ACCELERATED_VISUAL, 1);
//			SDL_GL_SetAttribute(SDL_GL_DOUBLEBUFFER, 1);
//			SDL_GL_SetAttribute(SDL_GL_DEPTH_SIZE, 24);
			
			this->window = SDL_CreateWindow("dopple", SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED,
											width, height, SDL_WINDOW_OPENGL | SDL_WINDOW_SHOWN);
			if(this->window == 0) {
				SDL_Quit();
				return;
			}
			
			this->ctx = SDL_GL_CreateContext(this->window);
			glViewport(0, 0, width, height);
			glClearColor(0, 0, 0, 1);
			glClear(GL_COLOR_BUFFER_BIT);
			
			bool success = true;
			GLenum error = GL_NO_ERROR;
			
			//Initialize Projection Matrix
			glMatrixMode( GL_PROJECTION );
			glLoadIdentity();
			
			//Check for error
			error = glGetError();
			if( error != GL_NO_ERROR )
			{
				//printf( "Error initializing OpenGL! %s\n", gluErrorString( error ) );
				success = false;
			}
			
			//Initialize Modelview Matrix
			glMatrixMode( GL_MODELVIEW );
			glLoadIdentity();
			
			//Check for error
			error = glGetError();
			if( error != GL_NO_ERROR )
			{
				//printf( "Error initializing OpenGL! %s\n", gluErrorString( error ) );
				success = false;
			}
			
			//Initialize clear color
			glClearColor( 0.f, 0.f, 0.f, 1.f );
			
			//Check for error
			error = glGetError();
			if( error != GL_NO_ERROR )
			{
				//printf( "Error initializing OpenGL! %s\n", gluErrorString( error ) );
				success = false;
			}
		}
		
		void start()
		{
			SDL_GL_SwapWindow(this->window);
			SDL_AddEventWatch(SDLEventFilter, nullptr);
			
			SDL_Event event;
			
			auto done = false;
			while(!done)
			{
				SDL_PumpEvents();
				while(SDL_PollEvent(&event))
				{
					switch(event.type)
					{
						case SDL_QUIT:
							done = true;
							break;
							
						case SDL_APP_DIDENTERFOREGROUND:
							//SDL_Log("SDL_APP_DIDENTERFOREGROUND");
							break;
							
						case SDL_APP_DIDENTERBACKGROUND:
							//SDL_Log("SDL_APP_DIDENTERBACKGROUND");
							break;
							
						case SDL_APP_LOWMEMORY:
							//SDL_Log("SDL_APP_MEMORY");
							break;
							
						case SDL_APP_TERMINATING:
							//SDL_Log("SDL_APP_TERMINATING");
							break;
							
						case SDL_APP_WILLENTERBACKGROUND:
							//SDL_Log("SDL_APP_WILLENTERBACKGROUND");
							break;
							
						case SDL_APP_WILLENTERFOREGROUND:
							//SDL_Log("SDL_APP_WILLENTERFOREGROUND");
							break;
							
						case SDL_WINDOWEVENT:
						{
							switch(event.window.event)
							{
								case SDL_WINDOWEVENT_SHOWN:
									//SDL_Log("Window %d show", event.window.windowID);
									break;
									
								case SDL_WINDOWEVENT_HIDDEN:
									//SDL_Log("Window %d hidden", event.window.windowID);
									break;
									
								case SDL_WINDOWEVENT_EXPOSED:
									//SDL_Log("Window %d exposed", event.window.windowID);
									break;
									
								case SDL_WINDOWEVENT_MOVED:
									//SDL_Log("Window %d moved to %d, %d",
									//		event.window.windowID, event.window.data1, event.window.data2);
									break;
									
								case SDL_WINDOWEVENT_RESIZED:
									//SDL_Log("Window %d resized to %dx%d",
									//		event.window.windowID, event.window.data1, event.window.data2);
									break;
									
								case SDL_WINDOWEVENT_MINIMIZED:
									//SDL_Log("Window %d minimized", event.window.windowID);
									break;
									
								case SDL_WINDOWEVENT_MAXIMIZED:
									//SDL_Log("Window %d maximized", event.window.windowID);
									break;
									
								case SDL_WINDOWEVENT_RESTORED:
									//SDL_Log("Window %d restored", event.window.windowID);
									break;
									
								case SDL_WINDOWEVENT_ENTER:
									//SDL_Log("Mouse entered window %d", event.window.windowID);
									break;
									
								case SDL_WINDOWEVENT_LEAVE:
									//SDL_Log("Mouse left window %d", event.window.windowID);
									break;
									
								case SDL_WINDOWEVENT_FOCUS_GAINED:
									//SDL_Log("Window %d gained keyboard focus", event.window.windowID);
									break;
									
								case SDL_WINDOWEVENT_FOCUS_LOST:
									//SDL_Log("Window %d lost keyboard focus", event.window.windowID);
									break;
									
								case SDL_WINDOWEVENT_CLOSE:
									//SDL_Log("Window %d closed", event.window.windowID);
									break;
									
								default:
									//SDL_Log("Window %d got unknown event %d", event.window.windowID, event.window.event);
									break;
							}
						}
					}
				}
				
				glClearColor(0.9, 0.9, 0.9, 1.0);
				glClear(GL_COLOR_BUFFER_BIT);
				
				if(this->requestAnimFrame) {
					this->requestAnimFrame();
				}
				
				SDL_GL_SwapWindow(this->window);
			}
			
			SDL_GL_DeleteContext(this->ctx);

			SDL_DestroyWindow(this->window);
			SDL_Quit();
		}
		
		//
		SDL_Window *window = nullptr;
		SDL_GLContext ctx = nullptr;
		void (*requestAnimFrame)() = nullptr;
	};
}
