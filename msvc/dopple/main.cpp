#include "dopple.h"

void *canvas = nullptr;

void init()
{
}

int main(int argc, char **argv)
{
	dopple::create();
	canvas = nullptr;
	init();
	dopple::destroy();
	return 0;
}