#pragma once

#include "stb/stb_image.h"

struct Image
{
	void load()
	{
		unsigned char *data = 
			stbi_load(this->src + dopple::STR_HEADER_SIZE, &this->x, &this->y, &this->comp, 0);

		if(data == nullptr) {
			printf("Error: Could not load image from path: %s\n", this->src + dopple::STR_HEADER_SIZE);
			return;
		}

		this->loaded = 1;
		stbi_image_free(data);

		if(this->onload) {
			this->onload();
		}
	}

	inline void __setter__src(char *src) {
		this->src = src;
		this->load();
	}

	inline char *__getter__src() {
		return this->src;
	}

	//
	int x, y, comp;
	char *src = nullptr;
	int8 loaded = 0;
	void (*onload)() = nullptr;
};