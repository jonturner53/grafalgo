BIN = ~/bin
SHELL := /bin/bash
IDIR = $(shell cd ..; pwd)/include
LDIR = $(shell cd ..; pwd)/lib
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
# CXXFLAGS =-O2 -m64 -I ${IDIR}

all:
	make -C basic       IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
			    CXXFLAGS='${CXXFLAGS}' all
	make -C graphs      IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
			    CXXFLAGS='${CXXFLAGS}' all
	make -C heaps       IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
			    CXXFLAGS='${CXXFLAGS}' all
	make -C searchTrees IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
			    CXXFLAGS='${CXXFLAGS}' all
	make -C advanced    IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
			    CXXFLAGS='${CXXFLAGS}' all

clean:
	make -C basic       clean
	make -C graphs      clean
	make -C heaps       clean
	make -C searchTrees clean
	make -C advanced    clean
