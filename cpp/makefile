# Top level makefile, order of lower-level makes matters
SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
BIN := ~/bin
#CXXFLAGS := -Wall ${ARCH} -O2 -DNDEBUG -std=c++0x
CXXFLAGS := -Wall ${ARCH} -std=c++0x

all:
	make -C misc            WARN='${WARN}' ARCH='${ARCH}' \
				BIN='${BIN}' CXXFLAGS='${CXXFLAGS}' all
	make -C dataStructures  WARN='${WARN}' ARCH='${ARCH}' \
				BIN='${BIN}' CXXFLAGS='${CXXFLAGS}' all
	make -C graphAlgorithms WARN='${WARN}' ARCH='${ARCH}' \
				BIN='${BIN}' CXXFLAGS='${CXXFLAGS}' all

clean:
	rm -f lib/*.a
	make -C misc            clean
	make -C dataStructures  clean
	make -C graphAlgorithms clean

